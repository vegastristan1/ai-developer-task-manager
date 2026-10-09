#!/usr/bin/env node
/**
 * Environment doctor — validates local setup before you build, test, or QA.
 *
 * Usage:
 *   node scripts/doctor.mjs [--env <path>]
 *
 * Checks:
 *   - Node.js version (>= 20)
 *   - env file exists and contains every key from .env.example
 *   - AUTH_SECRET is at least 32 characters (enforced by the app in production)
 *   - DATABASE_URL parses and its host:port accepts TCP connections
 *   - Database answers SELECT 1 and has at least one applied migration
 *   - Prisma client is generated
 *
 * Exit codes: 0 = all good, 1 = at least one failed check, 2 = usage error.
 */

import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// pg's sslmode deprecation warning is noise here — forward everything else.
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (!String(warning.message).includes('SSL modes')) {
    console.warn(`${warning.name}: ${warning.message}`);
  }
});

function usageError(message) {
  console.error(`doctor: ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  let envPath = path.join(root, '.env.local');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--env') {
      const value = argv[++i];
      if (!value) usageError('--env requires a path');
      envPath = path.resolve(value);
    } else if (argv[i] === '-h' || argv[i] === '--help') {
      console.log('Usage: node scripts/doctor.mjs [--env <path>]');
      process.exit(0);
    } else {
      usageError(`unknown argument: ${argv[i]}`);
    }
  }
  return { envPath };
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function tcpReachable(host, port, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

const results = [];
function record(label, ok, detail = '', level = 'error') {
  results.push({ label, ok, detail, level });
}

async function main() {
  const { envPath } = parseArgs(process.argv.slice(2));

  // 1. Node version
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  record('Node.js >= 20', nodeMajor >= 20, `found ${process.versions.node}`);

  // 2. env file exists
  const fileEnv = parseEnvFile(envPath);
  const relEnv = path.relative(root, envPath) || envPath;
  record(`env file present (${relEnv})`, fileEnv !== null);

  // 3. every .env.example key has a non-empty value (file or real environment)
  const exampleEnv = parseEnvFile(path.join(root, '.env.example')) ?? {};
  const requiredKeys = Object.keys(exampleEnv);
  const valueOf = (key) => process.env[key] || fileEnv?.[key] || '';
  const missing = requiredKeys.filter((key) => !valueOf(key));
  record(
    `required vars set (${requiredKeys.length} from .env.example)`,
    missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : '',
  );

  // 4. AUTH_SECRET length (the app throws in production below 32)
  const authSecret = valueOf('AUTH_SECRET');
  record(
    'AUTH_SECRET is at least 32 characters',
    authSecret.length >= 32,
    authSecret.length ? `length ${authSecret.length}` : 'not set',
  );

  // 5. DATABASE_URL parses
  const databaseUrl = valueOf('DATABASE_URL');
  let dbHost = null;
  let dbPort = 5432;
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      dbHost = parsed.hostname;
      dbPort = Number(parsed.port || 5432);
      record('DATABASE_URL parses', Boolean(dbHost), `${dbHost}:${dbPort}`);
    } catch {
      record('DATABASE_URL parses', false, 'not a valid URL');
    }
  } else {
    record('DATABASE_URL parses', false, 'not set');
  }

  // 6. TCP reachability
  let dbUp = false;
  if (dbHost) {
    dbUp = await tcpReachable(dbHost, dbPort);
    record(`database accepts connections (${dbHost}:${dbPort})`, dbUp, '', 'error');
  }

  // 7. SQL: SELECT 1 + applied migrations
  if (dbUp && databaseUrl) {
    try {
      const { default: pg } = await import('pg');
      const client = new pg.Client({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 6000,
      });
      await client.connect();
      await client.query('SELECT 1');
      record('database responds to queries', true);
      try {
        const { rows } = await client.query(
          'SELECT COUNT(*)::int AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL',
        );
        const count = rows[0]?.count ?? 0;
        record(
          'migrations applied',
          count > 0,
          count ? `${count} applied` : 'none applied — run `npm run db:migrate`',
        );
      } catch {
        record('migrations applied', false, 'migration table missing — run `npm run db:migrate`');
      }
      await client.end();
    } catch (error) {
      record('database responds to queries', false, error.message);
    }
  }

  // 8. Prisma client generated
  const prismaDir = path.join(root, 'generated', 'prisma');
  const generated = fs.existsSync(prismaDir) && fs.readdirSync(prismaDir).length > 0;
  record('Prisma client generated', generated, generated ? '' : 'run `npx prisma generate`');

  // Report
  console.log('Environment doctor\n');
  const pad = Math.max(...results.map((r) => r.label.length));
  for (const result of results) {
    const mark = result.ok ? '✓' : result.level === 'warning' ? '!' : '✗';
    console.log(
      `  ${mark} ${result.label.padEnd(pad)}${result.detail ? `  ${result.detail}` : ''}`,
    );
  }

  const failed = results.filter((r) => !r.ok && r.level === 'error').length;
  console.log(`\n${results.length} checks, ${failed} failed`);
  if (failed > 0) {
    console.log('Fix the failures above, then re-run `npm run doctor`.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`doctor: ${error.stack || error.message}`);
  process.exit(1);
});
