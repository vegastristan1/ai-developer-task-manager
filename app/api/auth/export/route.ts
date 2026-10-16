import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      projects: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          repositoryUrl: true,
          technologyStack: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          labels: { select: { id: true, name: true, color: true } },
          sprints: {
            orderBy: { startDate: 'asc' },
            select: {
              id: true,
              name: true,
              goal: true,
              startDate: true,
              endDate: true,
            },
          },
          tasks: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              type: true,
              technicalArea: true,
              complexity: true,
              estimatedEffort: true,
              actualEffort: true,
              dueDate: true,
              implementationPlan: true,
              acceptanceCriteria: true,
              technicalNotes: true,
              sprintId: true,
              parentTaskId: true,
              createdAt: true,
              updatedAt: true,
              labels: { select: { label: { select: { name: true, color: true } } } },
            },
          },
        },
      },
      conversations: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          projectId: true,
          createdAt: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: 'asc' },
            select: { role: true, content: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { exportedAt: new Date().toISOString(), user },
    {
      headers: {
        'Content-Disposition': `attachment; filename="workspace-export-${user.id}.json"`,
      },
    },
  );
}
