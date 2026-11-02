#!/usr/bin/env node

console.log(`
Important project commands

Development
  npm run dev                 Start the development server.
  npm run help                Show this command guide.

Checks and QA
  npm run doctor              Check environment and database health.
  npm run verify              Run the complete formatting, lint, type, build, and test checks.
  npm run verify:quick        Run the faster formatting, lint, type, and unit checks.
  npm run qa                  Build, smoke-test, and keep the production server running for QA.
  npm run smoke               Run the configured smoke test against a running app.

Tests
  npm run test                Run the full Vitest and Playwright test suites.
  npm run test:unit           Run unit and component tests.
  npm run test:api            Run API tests.
  npm run test:e2e            Build and run end-to-end tests.

Database
  npm run db:reseed           Recreate local demo data.
  npm run db:seed:qa          Add repeatable QA edge-case data.
  npm run db:reset            Destructively reset the database.
  npm run db:promote-admin    Promote a user to admin by email.
`);
