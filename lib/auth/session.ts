import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';

type AuthResult = { session: Session; response: null } | { session: null; response: NextResponse };

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

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  // Built entirely from JWT session claims — no database round trip.
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email,
    image: session.user.image ?? null,
  };
}
