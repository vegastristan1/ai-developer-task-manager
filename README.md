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

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Route Handlers, Server Actions |
| Database | PostgreSQL (Neon), Prisma ORM |
| AI | OpenAI API |
| Validation | Zod |
| Testing | Vitest, React Testing Library, Playwright |
| Deployment | Vercel |

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

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## License

Built as a portfolio project.
