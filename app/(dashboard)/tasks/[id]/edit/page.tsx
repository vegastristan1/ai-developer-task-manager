import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { TaskForm } from '@/components/tasks/task-form';
import { getSessionUser } from '@/lib/auth/session';
import { listLabels } from '@/services/labels';
import { getTask } from '@/services/tasks';

export const metadata: Metadata = { title: 'Edit task' };

export const instant = false;

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

function toDateString(value: Date | null): string {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const task = await getTask(id, user.id);
  if (!task) {
    notFound();
  }

  const labels = (await listLabels(user.id, task.projectId)) ?? [];
  const criteria = Array.isArray(task.acceptanceCriteria)
    ? task.acceptanceCriteria.filter((item): item is string => typeof item === 'string')
    : [];

  return (
    <>
      <PageHeader title="Edit task" description={`Editing “${task.title}”`} />
      <TaskForm
        mode="edit"
        labels={labels.map((label) => ({
          id: label.id,
          name: label.name,
          color: label.color,
        }))}
        initial={{
          id: task.id,
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          status: task.status,
          priority: task.priority,
          type: task.type,
          technicalArea: task.technicalArea,
          complexity: task.complexity,
          dueDate: toDateString(task.dueDate),
          estimatedEffort: task.estimatedEffort,
          actualEffort: task.actualEffort,
          technicalNotes: task.technicalNotes,
          acceptanceCriteria: criteria,
          labelIds: task.labels.map(({ label }) => label.id),
        }}
      />
    </>
  );
}
