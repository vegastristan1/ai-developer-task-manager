import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { sendDigestEmail } from '@/lib/email/digest';
import { getReminders } from '@/lib/reminders';
import { clientIp } from '@/lib/security/rate-limit';
import { rateLimitResponse } from '@/lib/security/responses';

const EMAIL_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_LIMIT = 5;

/** Emails the signed-in user their current reminders summary. */
export async function POST(request: Request) {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const limited = rateLimitResponse(
    `digest:${session.user.id}:${clientIp(request)}`,
    EMAIL_LIMIT,
    EMAIL_WINDOW_MS,
  );
  if (limited) return limited;

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reminders = await getReminders(account.id);
  const sent = await sendDigestEmail(account.email, account.name, reminders);

  return NextResponse.json({ ok: true, counts: reminders.counts, ...sent });
}
