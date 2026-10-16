import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

config({ path: ['.env.local', '.env'], quiet: true });

// One-time, non-destructive admin bootstrap. Unlike db:seed (which wipes and
// recreates demo data), this only flips flags on an existing account:
//   npm run db:promote-admin -- you@example.com
//   npm run db:promote-admin -- vegastristan1@gmail.com other@example.com
// Flow: register the admin email normally, run this, done.
// Note: vegastristan1@gmail.com (plus ADMIN_EMAILS) is now auto-approved on
// register and self-heals on login, so this script is only a manual fallback.
const emails = process.argv.slice(2).filter(Boolean);
const targets = emails.length > 0 ? emails : ['vegastristan1@gmail.com'];

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env['DATABASE_URL']) {
    throw new Error('DATABASE_URL is not set. For prod, use the Neon URL from Vercel env.');
  }
  for (const email of targets) {
    try {
      const user = await prisma.user.update({
        where: { email },
        data: { approved: true, approvedAt: new Date(), isAdmin: true },
        select: { id: true, email: true, approved: true, isAdmin: true },
      });
      console.log(
        `Promoted to admin: ${user.email} (approved=${user.approved}, isAdmin=${user.isAdmin})`,
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        console.error(`User not found: ${email}. Register that email first, then re-run.`);
        process.exitCode = 1;
        continue;
      }
      throw error;
    }
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
