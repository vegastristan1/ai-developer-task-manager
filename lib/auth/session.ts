import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';

type AuthResult =
  | { session: Session; response: null }
  | { session: null; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { session, response: null };
}
