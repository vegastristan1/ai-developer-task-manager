import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.env.TEST_PORT ?? 4100);
const BASE_URL = `http://localhost:${PORT}`;

let server: ChildProcess | null = null;

async function isUp(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/login`, { redirect: 'manual' });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 60_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function killTree(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

export default async function globalSetup(): Promise<(() => void) | undefined> {
  process.env.TEST_BASE_URL = BASE_URL;

  if (await isUp()) {
    console.log(`[vitest] reusing server at ${BASE_URL}`);
    return;
  }

  if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
    throw new Error('[vitest] No production build found. Run `npm run build` before tests.');
  }

  const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  console.log(`[vitest] starting next start on port ${PORT}...`);
  server = spawn(process.execPath, [nextBin, 'start', '--port', String(PORT)], {
    cwd: root,
    // Next.js skips .env.local when NODE_ENV=test (set by Vitest), so force production.
    // Blank the AI env so the suite always runs the deterministic mock path
    // (dotenv-style loading never overrides vars that are already set).
    env: {
      ...process.env,
      NODE_ENV: 'production',
      OPENAI_API_KEY: '',
      OPENAI_BASE_URL: '',
      OPENAI_MODEL: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr?.on('data', (chunk: Buffer) => {
    const line = chunk.toString();
    if (line.trim()) process.stderr.write(`[next:${PORT}] ${line}`);
  });

  if (!(await waitForServer())) {
    killTree(server);
    throw new Error(`[vitest] server on port ${PORT} did not become ready`);
  }
  console.log(`[vitest] server ready at ${BASE_URL}`);

  return () => {
    if (server) killTree(server);
  };
}
