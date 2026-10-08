import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { SprintForm } from '@/components/sprints/sprint-form';
import { getSessionUser } from '@/lib/auth/session';
import { getSprint } from '@/services/sprints';

export const metadata: Metadata = { title: 'Edit sprint' };

export const instant = false;

interface EditSprintPageProps {
  params: Promise<{ id: string }>;
}

function toInputDate(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export default async function EditSprintPage({ params }: EditSprintPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const sprint = await getSprint(id, user.id);
  if (!sprint) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Edit sprint" description={`Update ${sprint.name}.`} />
      <SprintForm
        mode="edit"
        initial={{
          id: sprint.id,
          name: sprint.name,
          goal: sprint.goal,
          startDate: toInputDate(sprint.startDate),
          endDate: toInputDate(sprint.endDate),
          projectId: sprint.projectId,
        }}
      />
    </>
  );
}
