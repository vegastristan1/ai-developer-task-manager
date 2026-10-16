import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { clientIp } from '@/lib/security/rate-limit';
import { rateLimitResponse } from '@/lib/security/responses';

const INVALIDATE_WINDOW_MS = 60 * 60 * 1000;
const INVALIDATE_LIMIT = 10;

/**
 * Signs out all sessions for the caller by bumping User.tokenVersion.
 * Stale JWTs are rejected within about a minute (see the jwt callback).
 * The caller keeps its own session by refreshing it afterwards
 * (useSession().update()), which re-syncs the new version into its token.
 */
export async function POST(request: Request) {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const limited = rateLimitResponse(
    `signout-all:${session.user.id}:${clientIp(request)}`,
    INVALIDATE_LIMIT,
    INVALIDATE_WINDOW_MS,
  );
  if (limited) return limited;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });

  return NextResponse.json({ ok: true, tokenVersion: updated.tokenVersion });
}
