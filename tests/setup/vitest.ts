import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest runs with NODE_ENV=test; load env files manually so modules that
// construct a Prisma client at import time (DATABASE_URL) can load.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
config({ path: path.join(root, '.env.local') });

afterEach(cleanup);
