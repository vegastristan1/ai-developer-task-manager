// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ActionCard } from '@/components/chat/action-card';
import type { ChatAction } from '@/lib/ai/actions';

const createAction: ChatAction = {
  type: 'create_task',
  params: { title: 'Add rate limiting', description: 'Created from AI chat', priority: 'HIGH' },
};

const statusAction: ChatAction = {
  type: 'set_task_status',
  params: { taskId: 't1', taskTitle: 'First task', status: 'DONE' },
};

describe('ActionCard', () => {
  it('renders a proposed create_task action', () => {
    render(
      <ActionCard
        action={createAction}
        canApprove
        isApproving={false}
        onApprove={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('Proposed action')).toBeTruthy();
    expect(screen.getByText('Add rate limiting')).toBeTruthy();
    expect(screen.getByText('New task')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
    expect(screen.getByText('Approve')).toBeTruthy();
    expect(screen.getByText('Dismiss')).toBeTruthy();
  });

  it('renders a set_task_status action with its target status', () => {
    render(
      <ActionCard
        action={statusAction}
        canApprove
        isApproving={false}
        onApprove={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('First task')).toBeTruthy();
    expect(screen.getByText(/Done/)).toBeTruthy();
  });

  it('calls onApprove and onDismiss', () => {
    const onApprove = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ActionCard
        action={createAction}
        canApprove
        isApproving={false}
        onApprove={onApprove}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByText('Approve'));
    expect(onApprove).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('disables approve and explains when no project is bound', () => {
    render(
      <ActionCard
        action={createAction}
        canApprove={false}
        isApproving={false}
        onApprove={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText(/Bind a project to this chat/)).toBeTruthy();
    expect((screen.getByText('Approve').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('disables both buttons while approving', () => {
    render(
      <ActionCard
        action={createAction}
        canApprove
        isApproving
        onApprove={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect((screen.getByText('Approve').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByText('Dismiss').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
