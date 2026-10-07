import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

config({ path: ['.env.local', '.env'], quiet: true });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [users, projects, tasks, labels, sprints, dependencies, conversations, messages] =
    await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.label.count(),
      prisma.sprint.count(),
      prisma.taskDependency.count(),
      prisma.aIConversation.count(),
      prisma.aIMessage.count(),
    ]);

  console.log('Database row counts:');
  console.table({
    User: users,
    Project: projects,
    Task: tasks,
    Label: labels,
    Sprint: sprints,
    TaskDependency: dependencies,
    AIConversation: conversations,
    AIMessage: messages,
  });

  const demoUser = await prisma.user.findUnique({ where: { email: 'alex@example.com' } });
  console.log(
    demoUser ? `Demo user OK: ${demoUser.email} (${demoUser.name})` : 'ERROR: demo user missing',
  );

  const blocked = await prisma.task.findMany({
    where: {
      status: { not: 'DONE' },
      dependencies: { some: { dependsOn: { status: { not: 'DONE' } } } },
    },
    select: {
      title: true,
      dependencies: { select: { dependsOn: { select: { title: true, status: true } } } },
    },
  });

  console.log(`Blocked-by-incomplete-dependency tasks: ${blocked.length}`);
  for (const task of blocked) {
    const blockers = task.dependencies.map((d) => `${d.dependsOn.title} [${d.dependsOn.status}]`);
    console.log(`  - ${task.title} (waiting on: ${blockers.join(', ')})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
