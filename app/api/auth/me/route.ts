import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  });
}
