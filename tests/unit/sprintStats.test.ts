import { describe, expect, it } from 'vitest';
import { computeSprintStats } from '@/services/sprints';

const past = new Date('2026-09-01T00:00:00Z');
const now = new Date('2026-10-01T00:00:00Z');

describe('computeSprintStats', () => {
  const tasks = [
    { status: 'TODO', priority: 'MEDIUM', type: 'FEATURE' },
    { status: 'IN_PROGRESS', priority: 'HIGH', type: 'BUG' },
    { status: 'IN_REVIEW', priority: 'LOW', type: 'FEATURE' },
    { status: 'BLOCKED', priority: 'CRITICAL', type: 'FEATURE' },
    { status: 'DONE', priority: 'MEDIUM', type: 'TESTING' },
    { status: 'DONE', priority: 'MEDIUM', type: 'FEATURE', dueDate: past },
    { status: 'TODO', priority: 'LOW', type: 'DOCUMENTATION', dueDate: past },
  ];

  it('computes totals and progress', () => {
    const stats = computeSprintStats(tasks, now);
    expect(stats.total).toBe(7);
    expect(stats.completed).toBe(2);
    expect(stats.remaining).toBe(5);
    expect(stats.progressPercent).toBe(29);
  });

  it('buckets by status, priority, and type with zero-filled keys', () => {
    const stats = computeSprintStats(tasks, now);
    expect(stats.byStatus).toEqual({
      TODO: 2,
      IN_PROGRESS: 1,
      IN_REVIEW: 1,
      BLOCKED: 1,
      DONE: 2,
    });
    expect(stats.byPriority).toEqual({ LOW: 2, MEDIUM: 3, HIGH: 1, CRITICAL: 1 });
    expect(stats.byType.FEATURE).toBe(4);
    expect(stats.byType.DEVOPS).toBe(0);
  });

  it('counts blocked, in-progress, in-review, and overdue (not done)', () => {
    const stats = computeSprintStats(tasks, now);
    expect(stats.blocked).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.inReview).toBe(1);
    expect(stats.todo).toBe(2);
    expect(stats.overdue).toBe(1);
  });

  it('handles an empty sprint', () => {
    const stats = computeSprintStats([], now);
    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.progressPercent).toBe(0);
    expect(stats.overdue).toBe(0);
    expect(stats.byStatus.TODO).toBe(0);
  });

  it('rounds progress to a whole percent', () => {
    const oneOfThree = [
      { status: 'DONE', priority: 'LOW', type: 'FEATURE' },
      { status: 'TODO', priority: 'LOW', type: 'FEATURE' },
      { status: 'TODO', priority: 'LOW', type: 'FEATURE' },
    ];
    expect(computeSprintStats(oneOfThree, now).progressPercent).toBe(33);
  });
});
