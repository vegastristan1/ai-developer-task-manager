#!/usr/bin/env node
/**
 * Reseed recovery — rebuilds a lost or destroyed database from scratch.
 *
 * Usage (dev, uses .env.local DATABASE_URL):
 *   npm run db:reseed
 *
 * Usage (fresh prod only, wipes everything):
 *   $env:DATABASE_URL="<prod-url>"; $env:ALLOW_PROD_SEED="true"; npm run db:reseed
 *
 * Steps:
 *   1. prisma migrate deploy (applies pending migrations, safe on empty DB)
 *   2. prisma db seed (destructive: wipes then recreates demo users + admin +
 *      demo projects/tasks from prisma/seed.ts)
 *   3. tsx scripts/seed-demo-users.ts (additive safety net — ensures all
 *      accounts exist even if the seed is interrupted)
 */
import { spawnSync } from 'node:child_process';

function run(label, command, args, env = process.env) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true, env });
  if (result.status !== 0) {
    console.error(`reseed failed at: ${label} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

const env = { ...process.env };
if (env.DATABASE_URL?.includes('neon.tech') && !env.PROD_DATABASE_URL && !env.ALLOW_PROD_SEED) {
  console.log('Target looks like Neon cloud and PROD_DATABASE_URL is not set.');
  console.log('Seeding dev branch — for prod, set PROD_DATABASE_URL + ALLOW_PROD_SEED=true.');
}

run('migrate deploy', 'npx', ['prisma', 'migrate', 'deploy'], env);
run('seed (destructive)', 'npx', ['prisma', 'db', 'seed'], env);
run('ensure demo users (additive)', 'npx', ['tsx', 'scripts/seed-demo-users.ts'], env);
console.log('\nReseed complete. Run `npm run doctor` to verify.');
