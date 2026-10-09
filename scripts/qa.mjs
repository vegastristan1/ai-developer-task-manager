#!/usr/bin/env node
/**
 * QA runner — build, smoke-test, then keep the server alive for manual QA.
 *
 * Usage:
 *   node scripts/qa.mjs [options]
 *
 * Options:
 *   --port <n>            Port to run on (default: 4300)
 *   --fresh               Rebuild even if a production build exists
 *   --exit-after-smoke    Stop the server and exit after the smoke test
 *   -h, --help            Show help
 *
 * Exit codes: 0 = smoke passed (or clean shutdown), 1 = build/server/smoke failed.
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const smokeScript = path.join(root, 'scripts', 'smoke.mjs');

const READY_TIMEOUT_MS = 60_000;
const READY_POLL_MS = 500;

function fail(message) {
  console.error(`qa: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { port: 4300, fresh: false, exitAfterSmoke: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      console.log('Usage: node scripts/qa.mjs [--port <n>] [--fresh] [--exit-after-smoke]');
      process.exit(0);
    } else if (arg === '--fresh') {
      opts.fresh = true;
    } else if (arg === '--exit-after-smoke') {
      opts.exitAfterSmoke = true;
    } else if (arg === '--port') {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value < 1 || value > 65535) {
        fail('--port requires an integer between 1 and 65535');
      }
      opts.port = value;
    } else {
      fail(`unknown argument: ${arg} (see --help)`);
    }
  }
  return opts;
}

function runStep(title, command, args) {
  console.log(`\n[qa] ${title}`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) fail(`${title}: ${result.error.message}`);
  if (result.status !== 0) fail(`${title} failed (exit ${result.status})`);
}

function stopServer(server) {
  if (!server || server.exitCode !== null || server.killed) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    server.kill('SIGTERM');
  }
}

async function waitForReady(baseUrl, server) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) return false;
    try {
      const response = await fetch(`${baseUrl}/login`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(3000),
      });
      if (response.status < 500) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
  }
  return false;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const baseUrl = `http://localhost:${opts.port}`;

  // 1. Build (only when missing or --fresh)
  const buildId = path.join(root, '.next', 'BUILD_ID');
  if (opts.fresh || !fs.existsSync(buildId)) {
    runStep(
      opts.fresh ? 'building production bundle (--fresh)' : 'no production build found — building',
      process.execPath,
      [nextBin, 'build'],
    );
  } else {
    console.log('[qa] using existing production build (--fresh to rebuild)');
  }

  // 2. Start server
  console.log(`\n[qa] starting production server on ${baseUrl}`);
  const server = spawn(process.execPath, [nextBin, 'start', '--port', String(opts.port)], {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: process.env,
  });

  let shuttingDown = false;
  server.on('exit', (code) => {
    if (shuttingDown) return;
    fail(`server exited unexpectedly (code ${code}) — port ${opts.port} may already be in use`);
  });

  const ready = await waitForReady(baseUrl, server);
  if (!ready) {
    stopServer(server);
    fail(
      server.exitCode !== null
        ? 'server failed to start'
        : `server not reachable at ${baseUrl} within ${READY_TIMEOUT_MS / 1000}s`,
    );
  }
  console.log(`[qa] server ready at ${baseUrl}`);

  // 3. Smoke test
  const smoke = spawnSync(process.execPath, [smokeScript, '--base-url', baseUrl], {
    cwd: root,
    stdio: 'inherit',
  });
  const smokeOk = !smoke.error && smoke.status === 0;

  // 4. Exit early or keep serving
  if (!smokeOk || opts.exitAfterSmoke) {
    shuttingDown = true;
    stopServer(server);
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!smokeOk) fail('smoke test failed');
    console.log('\n[qa] smoke passed — server stopped (--exit-after-smoke)');
    return;
  }

  console.log(`\n[qa] smoke passed — server kept running for your QA session.`);
  console.log(`[qa] open ${baseUrl} — press Ctrl+C to stop.\n`);

  const shutdown = () => {
    shuttingDown = true;
    console.log('\n[qa] stopping server...');
    stopServer(server);
    setTimeout(() => process.exit(0), 500);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => fail(error.stack || String(error)));
