import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getDashboardStats } from '@/services/dashboard';

export async function GET() {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const stats = await getDashboardStats(session.user.id);
  return NextResponse.json({ stats });
}
