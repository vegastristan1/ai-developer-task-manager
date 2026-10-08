import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { projectFilterSchema, projectSchema } from '@/lib/validations/project';
import { createProject, listProjects } from '@/services/projects';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const raw = Object.fromEntries(
    [...request.nextUrl.searchParams.entries()].filter(([, value]) => value !== ''),
  );
  const parsed = projectFilterSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid filters', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const projects = await listProjects(session.user.id, parsed.data);
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const project = await createProject(session.user.id, parsed.data);
  return NextResponse.json({ project }, { status: 201 });
}
