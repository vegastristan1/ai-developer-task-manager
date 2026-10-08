// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { ProjectStatusBadge } from '@/components/projects/status-badge';

describe('TaskStatusBadge', () => {
  it('renders the human label for each status', () => {
    const { rerender } = render(<TaskStatusBadge status="TODO" />);
    expect(screen.getByText('To do')).toBeTruthy();

    rerender(<TaskStatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('In progress')).toBeTruthy();

    rerender(<TaskStatusBadge status="BLOCKED" />);
    expect(screen.getByText('Blocked')).toBeTruthy();

    rerender(<TaskStatusBadge status="DONE" />);
    expect(screen.getByText('Done')).toBeTruthy();
  });
});

describe('TaskPriorityBadge', () => {
  it('renders labels for all priorities', () => {
    const { rerender } = render(<TaskPriorityBadge priority="LOW" />);
    expect(screen.getByText('Low')).toBeTruthy();

    rerender(<TaskPriorityBadge priority="MEDIUM" />);
    expect(screen.getByText('Medium')).toBeTruthy();

    rerender(<TaskPriorityBadge priority="HIGH" />);
    expect(screen.getByText('High')).toBeTruthy();

    rerender(<TaskPriorityBadge priority="CRITICAL" />);
    expect(screen.getByText('Critical')).toBeTruthy();
  });
});

describe('ProjectStatusBadge', () => {
  it('renders project status labels', () => {
    const { rerender } = render(<ProjectStatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeTruthy();

    rerender(<ProjectStatusBadge status="ON_HOLD" />);
    expect(screen.getByText('On hold')).toBeTruthy();

    rerender(<ProjectStatusBadge status="ARCHIVED" />);
    expect(screen.getByText('Archived')).toBeTruthy();
  });
});
