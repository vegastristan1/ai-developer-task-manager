#!/usr/bin/env node
/**
 * One-command verification — the same checks CI runs, locally.
 *
 * Usage:
 *   node scripts/verify.mjs [--quick]
 *
 * Full run:  format:check → lint → typecheck → tests (build + unit/api + e2e)
 * Quick run: format:check → lint → typecheck → unit/component tests
 *            (unit tests are skipped with a note when no production build exists,
 *             because the Vitest global setup needs .next/BUILD_ID)
 *
 * Exit codes: 0 = all steps passed, 1 = a step failed.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quick = process.argv.includes('--quick');

if (
  process.argv.some(
    (arg) => arg.startsWith('-') && arg !== '--quick' && arg !== '-h' && arg !== '--help',
  )
) {
  console.error('verify: unknown argument (see --help)');
  process.exit(1);
}
if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.log('Usage: node scripts/verify.mjs [--quick]');
  process.exit(0);
}

const hasBuild = fs.existsSync(path.join(root, '.next', 'BUILD_ID'));

const steps = [
  { name: 'format:check', command: 'npm', args: ['run', 'format:check'] },
  { name: 'lint', command: 'npm', args: ['run', 'lint'] },
  { name: 'typecheck', command: 'npm', args: ['run', 'typecheck'] },
];

if (quick) {
  if (hasBuild) {
    steps.push({ name: 'test:unit', command: 'npm', args: ['run', 'test:unit'] });
  } else {
    console.log(
      'verify (quick): no production build found — skipping unit tests.\n' +
        '                Run `npm run build` once (or `npm run verify`) to include them.\n',
    );
  }
} else {
  steps.push({ name: 'tests (build + vitest + playwright)', command: 'npm', args: ['test'] });
}

console.log(`verify${quick ? ' (quick)' : ''}: running ${steps.length} step(s)\n`);

for (const [index, step] of steps.entries()) {
  console.log(`— verify: step ${index + 1}/${steps.length}: ${step.name}`);
  const result = spawnSync(step.command, step.args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) {
    console.error(`verify: ${step.name}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\nverify: FAILED at step "${step.name}" (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log('');
}

console.log(`verify: all ${steps.length} step(s) passed`);
