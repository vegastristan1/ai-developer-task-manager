import { describe, expect, it } from 'vitest';
import { buildDigestText } from '@/lib/email/digest';

const reminders = {
  overdue: [
    {
      id: 't1',
      title: 'Late task',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: new Date('2026-01-01T00:00:00.000Z'),
      projectId: 'p1',
      project: { id: 'p1', name: 'Shop' },
    },
  ],
  dueSoon: [],
  blocked: [],
  counts: { overdue: 1, dueSoon: 0, blocked: 0 },
};

describe('digest text', () => {
  it('lists sections with counts and task lines', () => {
    const text = buildDigestText('Maya', reminders);
    expect(text).toContain('Hi Maya');
    expect(text).toContain('Overdue (1):');
    expect(text).toContain('- Late task [Shop] (was due 2026-01-01)');
    expect(text).toContain('Due soon (0):');
    expect(text).toContain('Blocked (0):');
  });

  it('falls back to a generic greeting without a name', () => {
    expect(buildDigestText(null, reminders)).toContain('Hi there');
  });
});
