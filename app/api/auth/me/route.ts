import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth/session';
import { deleteAccountSchema, profileSchema } from '@/lib/validations/auth';
import { prisma } from '@/lib/db/prisma';
import { readJsonBody } from '@/lib/security/body';
import { clientIp } from '@/lib/security/rate-limit';
import { rateLimitResponse } from '@/lib/security/responses';

const userSelect = { id: true, name: true, email: true, image: true } as const;

export async function GET() {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userSelect,
  });

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const updated = await prisma.user.updateMany({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      ...(parsed.data.image === undefined
        ? {}
        : { image: parsed.data.image === '' ? null : parsed.data.image }),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userSelect,
  });

  return NextResponse.json({ user });
}

const DELETE_WINDOW_MS = 60 * 60 * 1000;
const DELETE_LIMIT = 5;
const DELETE_MAX_BODY_BYTES = 2 * 1024;

export async function DELETE(request: NextRequest) {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const limited = rateLimitResponse(
    `delete-account:${session.user.id}:${clientIp(request)}`,
    DELETE_LIMIT,
    DELETE_WINDOW_MS,
  );
  if (limited) return limited;

  const parsedBody = await readJsonBody(request, DELETE_MAX_BODY_BYTES);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = deleteAccountSchema.safeParse(parsedBody.body);
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

  const valid = await bcrypt.compare(parsed.data.password, account.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  // Cascades to projects, tasks, conversations, and reset tokens.
  await prisma.user.delete({ where: { id: account.id } });

  return NextResponse.json({ ok: true });
}
