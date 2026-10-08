import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
      'server-only': path.resolve(root, 'tests/setup/server-only-stub.ts'),
    },
  },
  esbuild: { jsx: 'automatic' },
  test: {
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/component/**/*.test.{ts,tsx}',
      'tests/api/**/*.test.ts',
    ],
    exclude: ['node_modules/**', '.next/**', 'tests/e2e/**'],
    globalSetup: ['tests/setup/global.ts'],
    setupFiles: ['tests/setup/vitest.ts'],
    // API tests share one `next start` server and one dev database; running
    // files sequentially keeps interactive-transaction timeouts under load.
    fileParallelism: false,
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
});
