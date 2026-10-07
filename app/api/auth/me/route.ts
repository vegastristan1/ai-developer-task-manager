import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { profileSchema } from '@/lib/validations/auth';
import { prisma } from '@/lib/db/prisma';

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
    data: { name: parsed.data.name },
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
