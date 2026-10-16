import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

config({ path: ['.env.local', '.env'], quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

const TEST_PREFIXES = ['vitest-', 'brute-', 'smoke-'];

async function main() {
  const all = await prisma.user.findMany({ select: { email: true } });
  const targets = all
    .map((u) => u.email)
    .filter((email) => TEST_PREFIXES.some((prefix) => email.startsWith(prefix)));
  console.log(`Deleting ${targets.length} test users (cascades their data)...`);
  const result = await prisma.user.deleteMany({
    where: { OR: TEST_PREFIXES.map((prefix) => ({ email: { startsWith: prefix } })) },
  });
  console.log(`Deleted: ${result.count}`);

  const remaining = await prisma.user.findMany({
    select: { email: true },
    orderBy: { email: 'asc' },
  });
  console.log(`\nREMAINING USERS (${remaining.length}):`);
  for (const u of remaining) console.log(`- ${u.email}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
