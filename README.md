# AI Developer Task Manager

An AI-powered task and project management platform designed for software developers.

Instead of a generic todo app, this platform understands development work — it helps developers turn high-level requirements into actionable tasks, plan implementation, and keep sprints moving with AI assistance and human approval at every step.

## Features

**Project & Task Management**

- Projects with repository links and technology stack tracking
- Software-development-focused tasks: status, priority, type, technical area, complexity, effort tracking
- Subtasks, labels, acceptance criteria, and technical notes
- Task dependencies with automatic blocked-task detection
- Sprints with goals, date ranges, and progress tracking

**Developer Experience**

- Kanban board with drag-and-drop status updates
- Developer dashboard with metrics and analytics
- Global search with command palette
- Dark and light mode, responsive layout, keyboard shortcuts
- Skeleton loading, empty states, and confirmation dialogs

**AI Assistant**

- Break high-level requirements into subtasks
- Generate technical implementation plans
- Suggest acceptance criteria
- Estimate complexity and effort with reasoning
- Technical review: security, architecture, edge cases, and testing gaps
- Context-aware AI chat about your projects and sprints
- Approval workflow — AI suggestions are never applied automatically

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend    | Next.js Route Handlers, Server Actions              |
| Database   | PostgreSQL (Neon), Prisma ORM                       |
| AI         | OpenAI API                                          |
| Validation | Zod                                                 |
| Testing    | Vitest, React Testing Library, Playwright           |
| Deployment | Vercel                                              |

## Getting Started

**1. Clone and install**

```bash
git clone https://github.com/vegastristan1/ai-developer-task-manager.git
cd ai-developer-task-manager
npm install
```

**2. Configure environment**

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

You'll need a Neon PostgreSQL connection string and an OpenAI API key.

**3. Initialize the database**

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Seeding creates demo data, including a demo login for local development.

**4. Start the app**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Start development server                                |
| `npm run build`        | Production build                                        |
| `npm run lint`         | Run ESLint                                              |
| `npm run typecheck`    | TypeScript type check (`tsc --noEmit`)                  |
| `npm run format`       | Format with Prettier                                    |
| `npm run verify`       | Format + lint + typecheck + full test suite (CI parity) |
| `npm run verify:quick` | Format + lint + typecheck (+ unit tests if built)       |
| `npm run doctor`       | Check env vars, AUTH_SECRET, database, Prisma setup     |
| `npm run qa`           | Build → smoke test → keep server up for manual QA       |
| `npm run smoke`        | Run smoke tests                                         |
| `npm run db:migrate`   | Run Prisma migrations                                   |
| `npm run db:seed`      | Seed demo data                                          |
| `npm run db:seed:qa`   | Add idempotent QA edge-case data for the demo user      |
| `npm run db:reset`     | ⚠️ Destroy and recreate the database (destructive)      |
| `npm run db:studio`    | Open Prisma Studio                                      |

## Development Workflow

```bash
npm run doctor        # is my environment healthy?
npm run verify:quick  # fast local checks (format, lint, types)
npm run verify        # full CI parity (adds unit + API + E2E tests)
npm run qa            # build + smoke, then keep :4300 up for manual QA
```

- **`doctor`** validates `.env.local`, required variables from `.env.example`, the
  32-character `AUTH_SECRET` rule, database connectivity, applied migrations, and the
  generated Prisma client. Use `--env <path>` to check another env file.
- **`verify`** runs the same gates as CI in order, stopping at the first failure;
  `verify:quick` skips tests (unit tests run too when a production build exists).
- **`qa`** ensures a production build, starts it on port 4300 (`--port` to change),
  runs the smoke test, then leaves the server running for click-through QA —
  Ctrl+C stops it. `--fresh` forces a rebuild; `--exit-after-smoke` quits after smoke.
- **`db:seed:qa`** attaches edge cases to the demo user (overdue/due-soon tasks,
  blocked dependency chain, long content, full-detail critical bug, active sprint,
  empty project). Safe to re-run — existing rows are skipped. Run `npm run db:seed`
  first if the demo user doesn't exist yet.

## Smoke Test

A portable, zero-dependency smoke test lives in `scripts/smoke.mjs`. It checks HTTP status, response-time budgets, titles/content, and (when Playwright is installed) console errors — against any URL:

```bash
# against the local app (see smoke.config.json)
npm run smoke

# against any deployed site
npm run smoke -- --base-url https://your-app.vercel.app

# status/content checks only, no browser
npm run smoke -- --no-browser
```

Copy `scripts/smoke.mjs` and `smoke.config.json` into another project to reuse it — no install needed.

### Scheduled production smoke

`.github/workflows/smoke-prod.yml` runs the same smoke test against your deployed app
daily at 06:00 UTC (and on demand via **Run workflow**). It is skipped until you set the
`SMOKE_BASE_URL` repository variable under **Settings → Secrets and variables → Actions →
Variables**, e.g. `https://your-app.vercel.app`.

## License

Built as a portfolio project.
