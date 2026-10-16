import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({ approved: z.boolean() });

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: 'You cannot change your own account' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data.approved
      ? { approved: true, approvedAt: new Date() }
      : { approved: false, approvedAt: null },
    select: { id: true, email: true, approved: true },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
