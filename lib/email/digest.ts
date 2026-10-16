import { sendEmail } from '@/lib/email/sender';
import type { Reminders } from '@/lib/reminders';

function dueLabel(value: Date | null): string {
  if (!value) return 'no due date';
  return new Date(value).toISOString().slice(0, 10);
}

export function buildDigestText(name: string | null, reminders: Reminders): string {
  const lines = [
    `Hi ${name ?? 'there'}, here is your workspace summary.`,
    '',
    `Overdue (${reminders.counts.overdue}):`,
    ...reminders.overdue.map(
      (task) => `- ${task.title} [${task.project.name}] (was due ${dueLabel(task.dueDate)})`,
    ),
    '',
    `Due soon (${reminders.counts.dueSoon}):`,
    ...reminders.dueSoon.map(
      (task) => `- ${task.title} [${task.project.name}] (due ${dueLabel(task.dueDate)})`,
    ),
    '',
    `Blocked (${reminders.counts.blocked}):`,
    ...reminders.blocked.map((task) => `- ${task.title} [${task.project.name}]`),
  ];
  return lines.join('\n');
}

export async function sendDigestEmail(
  to: string,
  name: string | null,
  reminders: Reminders,
): Promise<{ delivered: 'resend' | 'log'; total: number }> {
  const total = reminders.counts.overdue + reminders.counts.dueSoon + reminders.counts.blocked;
  const text = buildDigestText(name, reminders);
  const result = await sendEmail({ to, subject: 'Your workspace digest', text });
  if (result.delivered === 'log') {
    console.log(`[email:log] digest for ${to} (${total} items):\n${text}`);
  }
  return { delivered: result.delivered, total };
}
