import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

config({ path: ['.env.local', '.env'], quiet: true });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

const DAY = 1000 * 60 * 60 * 24;

async function main() {
  console.log('Seeding database...');

  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.label.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      name: 'Alex Developer',
      passwordHash,
    },
  });

  const now = Date.now();

  const mainProject = await prisma.project.create({
    data: {
      name: 'AI Developer Task Manager',
      description:
        'An AI-powered task and project management platform designed specifically for software developers.',
      repositoryUrl: 'https://github.com/example/ai-developer-task-manager',
      technologyStack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Neon', 'OpenAI'],
      userId: user.id,
    },
  });

  const apiProject = await prisma.project.create({
    data: {
      name: 'E-commerce API',
      description: 'REST API for an online store with caching and background jobs.',
      repositoryUrl: 'https://github.com/example/ecommerce-api',
      technologyStack: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
      userId: user.id,
    },
  });

  const [frontend, backend, database, urgent, quickWin, api, infra] = await Promise.all([
    prisma.label.create({
      data: { name: 'frontend', color: '#3b82f6', projectId: mainProject.id },
    }),
    prisma.label.create({
      data: { name: 'backend', color: '#8b5cf6', projectId: mainProject.id },
    }),
    prisma.label.create({
      data: { name: 'database', color: '#f59e0b', projectId: mainProject.id },
    }),
    prisma.label.create({
      data: { name: 'urgent', color: '#ef4444', projectId: mainProject.id },
    }),
    prisma.label.create({
      data: { name: 'quick-win', color: '#10b981', projectId: mainProject.id },
    }),
    prisma.label.create({ data: { name: 'api', color: '#8b5cf6', projectId: apiProject.id } }),
    prisma.label.create({ data: { name: 'infra', color: '#6b7280', projectId: apiProject.id } }),
  ]);

  const sprint1 = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 — Foundation',
      goal: 'Database design and project scaffolding.',
      startDate: new Date(now - 21 * DAY),
      endDate: new Date(now - 7 * DAY),
      projectId: mainProject.id,
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      name: 'Sprint 2 — Core Features',
      goal: 'Authentication, API, and Kanban board.',
      startDate: new Date(now - 3 * DAY),
      endDate: new Date(now + 11 * DAY),
      projectId: mainProject.id,
    },
  });

  const schemaTask = await prisma.task.create({
    data: {
      title: 'Design PostgreSQL schema for core entities',
      description: 'Define users, projects, tasks, sprints, labels, and dependencies.',
      status: 'DONE',
      priority: 'HIGH',
      type: 'FEATURE',
      technicalArea: 'DATABASE',
      complexity: 'M',
      estimatedEffort: '6 hours',
      actualEffort: '7 hours',
      position: 0,
      sprintId: sprint1.id,
      projectId: mainProject.id,
      implementationPlan: [
        '# Implementation Plan',
        '',
        '## Database Changes',
        '- Users, Projects, Tasks tables',
        '- Labels and TaskLabels join table',
        '- TaskDependency self-relation',
        '',
        '## Testing',
        '- Migration up/down on staging',
      ].join('\n'),
      acceptanceCriteria: [
        { text: 'All core entities created via migration', done: true },
        { text: 'Indexes exist on hot query paths', done: true },
        { text: 'Seed data loads without errors', done: true },
      ],
      labels: { create: [{ labelId: database.id }] },
    },
  });

  const apiTask = await prisma.task.create({
    data: {
      title: 'Build REST API for projects and tasks',
      description: 'CRUD endpoints with Zod validation and authorization checks.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      type: 'FEATURE',
      technicalArea: 'API',
      complexity: 'L',
      estimatedEffort: '10 hours',
      position: 1,
      sprintId: sprint2.id,
      projectId: mainProject.id,
      dueDate: new Date(now + 5 * DAY),
      acceptanceCriteria: [
        { text: 'Projects CRUD works', done: true },
        { text: 'Tasks CRUD works', done: false },
        { text: 'All inputs validated with Zod', done: false },
      ],
      labels: { create: [{ labelId: backend.id }] },
      dependencies: { create: [{ dependsOnId: schemaTask.id }] },
    },
  });

  const uiTask = await prisma.task.create({
    data: {
      title: 'Implement Kanban board UI',
      description: 'Drag-and-drop board with five columns and task cards.',
      status: 'TODO',
      priority: 'HIGH',
      type: 'FEATURE',
      technicalArea: 'FRONTEND',
      complexity: 'L',
      estimatedEffort: '12 hours',
      position: 2,
      sprintId: sprint2.id,
      projectId: mainProject.id,
      labels: { create: [{ labelId: frontend.id }] },
      dependencies: { create: [{ dependsOnId: apiTask.id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Write integration tests',
      description: 'Cover the full API + UI flow with Playwright.',
      status: 'TODO',
      priority: 'MEDIUM',
      type: 'TESTING',
      technicalArea: 'TESTING',
      complexity: 'M',
      position: 3,
      projectId: mainProject.id,
      dependencies: { create: [{ dependsOnId: uiTask.id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Implement user authentication',
      description: 'Registration, login, sessions, and protected routes.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      type: 'FEATURE',
      technicalArea: 'BACKEND',
      complexity: 'XL',
      estimatedEffort: '20 hours',
      position: 4,
      sprintId: sprint2.id,
      projectId: mainProject.id,
      labels: { create: [{ labelId: backend.id }, { labelId: urgent.id }] },
      subtasks: {
        create: [
          {
            title: 'Create User database model',
            status: 'DONE',
            priority: 'HIGH',
            type: 'FEATURE',
            technicalArea: 'DATABASE',
            complexity: 'S',
            position: 5,
            projectId: mainProject.id,
          },
          {
            title: 'Add password hashing',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            type: 'FEATURE',
            technicalArea: 'BACKEND',
            complexity: 'S',
            position: 6,
            projectId: mainProject.id,
            labels: { create: [{ labelId: backend.id }] },
          },
          {
            title: 'Add authentication tests',
            status: 'TODO',
            priority: 'MEDIUM',
            type: 'TESTING',
            technicalArea: 'TESTING',
            complexity: 'M',
            position: 7,
            projectId: mainProject.id,
          },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Fix session refresh bug',
      description: 'Sessions expire unexpectedly after 15 minutes of inactivity.',
      status: 'BLOCKED',
      priority: 'CRITICAL',
      type: 'BUG',
      technicalArea: 'BACKEND',
      complexity: 'S',
      position: 8,
      projectId: mainProject.id,
      technicalNotes: 'Waiting for the auth middleware from the authentication epic.',
      labels: { create: [{ labelId: urgent.id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Deploy to Vercel',
      description: 'Production deployment with environment configuration.',
      status: 'TODO',
      priority: 'MEDIUM',
      type: 'DEVOPS',
      technicalArea: 'DEVOPS',
      complexity: 'M',
      position: 9,
      sprintId: sprint2.id,
      projectId: mainProject.id,
      labels: { create: [{ labelId: infra.id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Update README with setup guide',
      description: 'Document local setup, env vars, and deployment steps.',
      status: 'DONE',
      priority: 'LOW',
      type: 'DOCUMENTATION',
      complexity: 'XS',
      position: 10,
      projectId: mainProject.id,
      labels: { create: [{ labelId: quickWin.id }] },
    },
  });

  const catalogTask = await prisma.task.create({
    data: {
      title: 'Design product catalog API',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      type: 'FEATURE',
      technicalArea: 'API',
      complexity: 'M',
      position: 0,
      projectId: apiProject.id,
      labels: { create: [{ labelId: api.id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Add Redis caching for product queries',
      status: 'TODO',
      priority: 'MEDIUM',
      type: 'FEATURE',
      technicalArea: 'BACKEND',
      complexity: 'M',
      position: 1,
      projectId: apiProject.id,
      dependencies: { create: [{ dependsOnId: catalogTask.id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Fix checkout race condition',
      status: 'DONE',
      priority: 'CRITICAL',
      type: 'BUG',
      technicalArea: 'BACKEND',
      complexity: 'L',
      position: 2,
      projectId: apiProject.id,
      labels: { create: [{ labelId: infra.id }] },
    },
  });

  await prisma.aIConversation.create({
    data: {
      title: 'Sprint planning help',
      userId: user.id,
      projectId: mainProject.id,
      messages: {
        create: [
          {
            role: 'USER',
            content: 'What should I work on next in this sprint?',
          },
          {
            role: 'ASSISTANT',
            content:
              'Your critical path is authentication. Finish password hashing, then the auth tests — the blocked session bug depends on that work.',
          },
        ],
      },
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
