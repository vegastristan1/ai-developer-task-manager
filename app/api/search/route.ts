import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { searchQuerySchema } from '@/lib/validations/search';
import { searchAll } from '@/services/search';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const raw = Object.fromEntries(
    [...request.nextUrl.searchParams.entries()].filter(([, value]) => value !== ''),
  );
  const parsed = searchQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid search query', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const results = await searchAll(session.user.id, parsed.data);
  return NextResponse.json({ results });
}
