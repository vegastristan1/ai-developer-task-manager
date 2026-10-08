// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SprintProgressCard } from '@/components/dashboard/sprint-progress-card';
import type { DashboardSprintStat } from '@/services/dashboard';

const sprint: DashboardSprintStat = {
  id: 's1',
  name: 'Sprint 2',
  projectName: 'AI Developer Task Manager',
  startDate: new Date(2026, 8, 28),
  endDate: new Date(2026, 9, 12),
  total: 8,
  completed: 3,
  remaining: 5,
  inProgress: 2,
  inReview: 1,
  blocked: 1,
  todo: 4,
  overdue: 0,
  progressPercent: 38,
  byStatus: { TODO: 4, IN_PROGRESS: 2, IN_REVIEW: 1, BLOCKED: 1, DONE: 3 },
  byPriority: { LOW: 1, MEDIUM: 4, HIGH: 2, CRITICAL: 1 },
  byType: {
    FEATURE: 5,
    BUG: 1,
    REFACTOR: 1,
    DOCUMENTATION: 1,
    TESTING: 0,
    DEVOPS: 0,
  },
};

describe('SprintProgressCard', () => {
  it('renders sprint name, project, dates, and stats', () => {
    render(<SprintProgressCard sprint={sprint} />);
    expect(screen.getByText('Current sprint')).toBeTruthy();
    expect(screen.getByText('Sprint 2 · AI Developer Task Manager')).toBeTruthy();
    expect(screen.getByText('38%')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Remaining')).toBeTruthy();
    expect(screen.getByText('Blocked')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('Sep 28, 2026 – Oct 12, 2026')).toBeTruthy();
  });

  it('renders the empty state when there is no active sprint', () => {
    render(<SprintProgressCard sprint={null} />);
    expect(screen.getByText('Current sprint')).toBeTruthy();
    expect(screen.getByText(/No active sprint right now/)).toBeTruthy();
  });
});
