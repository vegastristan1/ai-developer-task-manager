import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getReminders } from '@/lib/reminders';

export { DUE_SOON_DAYS } from '@/lib/reminders';

export async function GET() {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  return NextResponse.json(await getReminders(session.user.id));
}
