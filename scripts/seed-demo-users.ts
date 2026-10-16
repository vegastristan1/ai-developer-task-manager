import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { ALL_SEED_USERS, DEMO_PASSWORD } from '../prisma/demo-users';

config({ path: ['.env.local', '.env'], quiet: true });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

// Additive, idempotent demo-user seeder — never wipes. Safe to run on dev or
// prod any time (e.g. after `db:seed`, after user cleanup, or to add missing
// accounts). Creates absent users with password `password123`, approves them,
// and ensures the bootstrap admin keeps isAdmin=true.
async function main() {
  const target = (process.env['DATABASE_URL'] ?? '').includes('@')
    ? (process.env['DATABASE_URL'] as string).split('@')[1]?.split('/')[0]
    : 'unknown host';
  console.log(`Ensuring demo users on ${target} ...`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  let created = 0;
  let existing = 0;

  for (const demo of ALL_SEED_USERS) {
    const found = await prisma.user.findUnique({ where: { email: demo.email } });
    if (!found) {
      await prisma.user.create({
        data: {
          email: demo.email,
          name: demo.name,
          passwordHash,
          approved: true,
          approvedAt: new Date(),
          isAdmin: demo.isAdmin,
        },
      });
      created += 1;
      console.log(`  + ${demo.email} (${demo.name})`);
    } else {
      const needsFix = !found.approved || (demo.isAdmin && !found.isAdmin) || !found.approvedAt;
      if (needsFix) {
        await prisma.user.update({
          where: { email: demo.email },
          data: {
            approved: true,
            approvedAt: found.approvedAt ?? new Date(),
            isAdmin: demo.isAdmin ? true : found.isAdmin,
            name: found.name ?? demo.name,
          },
        });
        console.log(`  ~ ${demo.email} (re-approved)`);
      } else {
        console.log(`  = ${demo.email} (exists)`);
      }
      existing += 1;
    }
  }

  console.log(`\nDemo users complete: ${created} created, ${existing} already existed.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
