import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/session';

export async function GET() {
  const { user, response } = await requireAdmin();
  if (!user) return response;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      approved: true,
      approvedAt: true,
      isAdmin: true,
      createdAt: true,
    },
    orderBy: [{ approved: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ users });
}
