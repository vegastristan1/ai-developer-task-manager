import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { readJsonBody } from '@/lib/security/body';
import { clientIp } from '@/lib/security/rate-limit';
import { rateLimitResponse } from '@/lib/security/responses';
import { passwordChangeSchema } from '@/lib/validations/auth';

const PASSWORD_WINDOW_MS = 15 * 60 * 1000;
const PASSWORD_LIMIT = 10;
const PASSWORD_MAX_BODY_BYTES = 10 * 1024;

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const limited = rateLimitResponse(
    `password:${session.user.id}:${clientIp(request)}`,
    PASSWORD_LIMIT,
    PASSWORD_WINDOW_MS,
  );
  if (limited) return limited;

  const parsedBody = await readJsonBody(request, PASSWORD_MAX_BODY_BYTES);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = passwordChangeSchema.safeParse(parsedBody.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, account.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: account.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
