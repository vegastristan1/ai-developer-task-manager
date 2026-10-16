import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

config({ path: ['.env.local', '.env'], quiet: true });

// One-time, non-destructive admin bootstrap. Unlike db:seed (which wipes and
// recreates demo data), this only flips flags on an existing account:
//   npm run db:promote-admin -- you@example.com
// Flow: register the admin email normally, run this, done.
const email = process.argv[2] ?? 'vegastristan1@gmail.com';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.update({
    where: { email },
    data: { approved: true, approvedAt: new Date(), isAdmin: true },
    select: { id: true, email: true, approved: true, isAdmin: true },
  });
  console.log(
    `Promoted to admin: ${user.email} (approved=${user.approved}, isAdmin=${user.isAdmin})`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
