import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

config({ path: ['.env.local', '.env'], quiet: true });

// pg's sslmode deprecation warning is noise here — forward everything else.
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (!String(warning.message).includes('SSL modes')) {
    console.warn(`${warning.name}: ${warning.message}`);
  }
});

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

const DAY = 1000 * 60 * 60 * 24;

let created = 0;
let skipped = 0;

function report(label: string, wasCreated: boolean) {
  if (wasCreated) {
    created += 1;
    console.log(`  + ${label}`);
  } else {
    skipped += 1;
    console.log(`  = ${label} (exists)`);
  }
}

async function ensureProject(userId: string, name: string, description: string) {
  const existing = await prisma.project.findFirst({ where: { userId, name } });
  if (existing) return { project: existing, wasCreated: false };
  const project = await prisma.project.create({ data: { name, description, userId } });
  return { project, wasCreated: true };
}

async function ensureLabel(projectId: string, name: string, color: string) {
  const existing = await prisma.label.findFirst({ where: { projectId, name } });
  if (existing) return { label: existing, wasCreated: false };
  const label = await prisma.label.create({ data: { name, color, projectId } });
  return { label, wasCreated: true };
}

async function ensureSprint(
  projectId: string,
  name: string,
  goal: string,
  startDate: Date,
  endDate: Date,
) {
  const existing = await prisma.sprint.findFirst({ where: { projectId, name } });
  if (existing) return { sprint: existing, wasCreated: false };
  const sprint = await prisma.sprint.create({
    data: { name, goal, startDate, endDate, projectId },
  });
  return { sprint, wasCreated: true };
}

async function ensureTask(projectId: string, title: string, data: Record<string, unknown>) {
  const existing = await prisma.task.findFirst({ where: { projectId, title } });
  if (existing) return { task: existing, wasCreated: false };
  const task = await prisma.task.create({
    data: { title, projectId, ...data } as never,
  });
  return { task, wasCreated: true };
}

async function ensureDependency(taskId: string, dependsOnId: string) {
  const existing = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
  });
  if (existing) return false;
  await prisma.taskDependency.create({ data: { taskId, dependsOnId } });
  return true;
}

async function ensureTaskLabel(taskId: string, labelId: string) {
  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });
  if (existing) return false;
  await prisma.taskLabel.create({ data: { taskId, labelId } });
  return true;
}

async function main() {
  console.log('Seeding QA edge-case data for the demo user...');

  const alex = await prisma.user.findUnique({ where: { email: 'alex@example.com' } });
  if (!alex) {
    throw new Error('Demo user alex@example.com not found — run `npm run db:seed` first.');
  }

  // --- Projects -------------------------------------------------------------
  const { project: qaProject, wasCreated: qaProjectCreated } = await ensureProject(
    alex.id,
    'QA Edge Cases',
    'Edge-case data for manual QA: overdue work, blocked chains, long content, and odd shapes.',
  );
  report('project: QA Edge Cases', qaProjectCreated);

  const { wasCreated: emptyProjectCreated } = await ensureProject(
    alex.id,
    'QA — Empty Project',
    'Intentionally contains no tasks — verifies empty states across the app.',
  );
  report('project: QA — Empty Project', emptyProjectCreated);

  // --- Labels ---------------------------------------------------------------
  const { label: edgeLabel, wasCreated: edgeLabelCreated } = await ensureLabel(
    qaProject.id,
    'edge-case',
    '#ec4899',
  );
  report('label: edge-case', edgeLabelCreated);
  const { label: qaLabel, wasCreated: qaLabelCreated } = await ensureLabel(
    qaProject.id,
    'qa',
    '#06b6d4',
  );
  report('label: qa', qaLabelCreated);

  // --- One task per kanban column -------------------------------------------
  const statusTasks = [
    {
      status: 'TODO' as const,
      title: 'QA: TODO — write release notes',
      priority: 'MEDIUM' as const,
    },
    {
      status: 'IN_PROGRESS' as const,
      title: 'QA: IN_PROGRESS — refactor settings page',
      priority: 'HIGH' as const,
    },
    {
      status: 'IN_REVIEW' as const,
      title: 'QA: IN_REVIEW — dashboard widgets PR',
      priority: 'MEDIUM' as const,
    },
    {
      status: 'BLOCKED' as const,
      title: 'QA: BLOCKED — waiting on design assets',
      priority: 'HIGH' as const,
    },
    { status: 'DONE' as const, title: 'QA: DONE — ship v1.0', priority: 'LOW' as const },
  ];
  for (const [index, item] of statusTasks.entries()) {
    const { wasCreated } = await ensureTask(qaProject.id, item.title, {
      status: item.status,
      priority: item.priority,
      type: 'FEATURE',
      technicalArea: 'FRONTEND',
      complexity: 'S',
      position: index,
    });
    report(item.title, wasCreated);
  }

  // --- Dates ----------------------------------------------------------------
  const overdue = await ensureTask(qaProject.id, 'QA: Overdue task (due last week)', {
    description: 'Past its due date — appears in "due soon"/overdue analysis and dashboard alerts.',
    status: 'TODO',
    priority: 'HIGH',
    type: 'BUG',
    technicalArea: 'BACKEND',
    complexity: 'M',
    position: 10,
    dueDate: new Date(Date.now() - 7 * DAY),
  });
  report('QA: Overdue task (due last week)', overdue.wasCreated);

  const dueSoon = await ensureTask(qaProject.id, 'QA: Due in 2 days', {
    description: 'Upcoming deadline — verifies due-soon sorting and dashboard metrics.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    type: 'FEATURE',
    complexity: 'S',
    position: 11,
    dueDate: new Date(Date.now() + 2 * DAY),
  });
  report('QA: Due in 2 days', dueSoon.wasCreated);

  // --- Long content ---------------------------------------------------------
  const longTitle =
    'QA: An intentionally very long task title that must truncate gracefully on kanban cards, ' +
    'list rows, search results, the command palette, and task detail headers without breaking ' +
    'the layout on mobile widths';
  const longDescription = Array.from(
    { length: 6 },
    (_, i) =>
      `Paragraph ${i + 1}: this description exists to be unreasonably long so that layouts, ` +
      'clamping, scrolling, and "read more" behaviour can be checked against realistic content ' +
      'instead of a one-line placeholder.',
  ).join('\n\n');
  const longTask = await ensureTask(qaProject.id, longTitle, {
    description: longDescription,
    status: 'IN_REVIEW',
    priority: 'LOW',
    type: 'DOCUMENTATION',
    technicalArea: 'FRONTEND',
    complexity: 'XL',
    position: 12,
    technicalNotes: 'Watch for horizontal overflow on narrow viewports.',
  });
  report('QA: long title/description task', longTask.wasCreated);

  // --- Dependency chain (blocked detection) ---------------------------------
  const chain1 = await ensureTask(qaProject.id, 'QA chain 1: database schema', {
    status: 'DONE',
    priority: 'HIGH',
    type: 'FEATURE',
    technicalArea: 'DATABASE',
    complexity: 'M',
    position: 20,
  });
  report('QA chain 1: database schema', chain1.wasCreated);
  const chain2 = await ensureTask(qaProject.id, 'QA chain 2: API endpoint', {
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    type: 'FEATURE',
    technicalArea: 'API',
    complexity: 'M',
    position: 21,
  });
  report('QA chain 2: API endpoint', chain2.wasCreated);
  const chain3 = await ensureTask(qaProject.id, 'QA chain 3: UI page', {
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'FEATURE',
    technicalArea: 'FRONTEND',
    complexity: 'M',
    position: 22,
  });
  report('QA chain 3: UI page (blocked by chain 2)', chain3.wasCreated);
  const chain4 = await ensureTask(qaProject.id, 'QA chain 4: end-to-end tests', {
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'TESTING',
    technicalArea: 'TESTING',
    complexity: 'M',
    position: 23,
  });
  report('QA chain 4: end-to-end tests (blocked by chain 3)', chain4.wasCreated);

  for (const [taskId, dependsOnId] of [
    [chain2.task.id, chain1.task.id],
    [chain3.task.id, chain2.task.id],
    [chain4.task.id, chain3.task.id],
  ]) {
    if (await ensureDependency(taskId, dependsOnId)) created += 1;
    else skipped += 1;
  }

  // --- Parent + subtasks ----------------------------------------------------
  const parent = await ensureTask(qaProject.id, 'QA: Parent feature with subtasks', {
    description: 'Expandable parent task — verifies subtask listing and progress.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    type: 'FEATURE',
    technicalArea: 'BACKEND',
    complexity: 'L',
    position: 30,
  });
  report('QA: Parent feature with subtasks', parent.wasCreated);

  const sub1 = await ensureTask(qaProject.id, 'QA subtask: build the parser', {
    status: 'DONE',
    priority: 'MEDIUM',
    type: 'FEATURE',
    complexity: 'S',
    position: 31,
    parentTaskId: parent.task.id,
    projectId: qaProject.id,
  });
  report('QA subtask: build the parser', sub1.wasCreated);
  const sub2 = await ensureTask(qaProject.id, 'QA subtask: write parser tests', {
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'TESTING',
    technicalArea: 'TESTING',
    complexity: 'S',
    position: 32,
    parentTaskId: parent.task.id,
  });
  report('QA subtask: write parser tests', sub2.wasCreated);

  // --- Fully detailed critical bug -----------------------------------------
  const critical = await ensureTask(qaProject.id, 'QA: CRITICAL bug with full detail', {
    description:
      'Exercises every task field at once: acceptance criteria, implementation plan, technical notes, effort tracking, labels, and dates.',
    status: 'BLOCKED',
    priority: 'CRITICAL',
    type: 'BUG',
    technicalArea: 'API',
    complexity: 'XL',
    estimatedEffort: '8 hours',
    position: 40,
    dueDate: new Date(Date.now() + 5 * DAY),
    technicalNotes: 'Reproduces only when two requests race the same session refresh.',
    implementationPlan: [
      '# Implementation Plan',
      '',
      '1. Add a failing race-condition test',
      '2. Serialize session refresh writes',
      '3. Verify under load',
    ].join('\n'),
    acceptanceCriteria: [
      { text: 'Race condition test exists and fails before the fix', done: true },
      { text: 'Refresh writes are serialized', done: false },
      { text: 'Load test shows no regressions', done: false },
    ],
  });
  report('QA: CRITICAL bug with full detail', critical.wasCreated);

  // --- Active sprint with progress -----------------------------------------
  const now = Date.now();
  const { sprint, wasCreated: sprintCreated } = await ensureSprint(
    qaProject.id,
    'QA: Active Sprint',
    'Verify sprint progress, analytics, and date handling (covers today).',
    new Date(now - 3 * DAY),
    new Date(now + 11 * DAY),
  );
  report('sprint: QA Active Sprint', sprintCreated);

  const sprintTasks = [
    { title: 'QA sprint: ship login page', status: 'DONE' as const },
    { title: 'QA sprint: wire analytics', status: 'DONE' as const },
    { title: 'QA sprint: polish empty states', status: 'DONE' as const },
    { title: 'QA sprint: refactor board DnD', status: 'TODO' as const },
    { title: 'QA sprint: draft v1.1 plan', status: 'TODO' as const },
  ];
  for (const [index, item] of sprintTasks.entries()) {
    const { wasCreated } = await ensureTask(qaProject.id, item.title, {
      status: item.status,
      priority: 'MEDIUM',
      type: 'FEATURE',
      position: 50 + index,
      sprintId: sprint.id,
    });
    report(item.title, wasCreated);
  }

  // --- Label attachments ----------------------------------------------------
  for (const [taskId, labelId] of [
    [overdue.task.id, edgeLabel.id],
    [critical.task.id, edgeLabel.id],
    [longTask.task.id, qaLabel.id],
  ]) {
    if (await ensureTaskLabel(taskId, labelId)) created += 1;
    else skipped += 1;
  }

  console.log(`\nQA seed complete: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
