import { describe, expect, it } from 'vitest';
import { mockBreakdown } from '@/lib/ai/mocks';
import type { AiTaskContext } from '@/lib/ai/prompts';
import { normalizeTitle } from '@/lib/utils';

function makeContext(overrides: Partial<AiTaskContext> = {}): AiTaskContext {
  return {
    title: 'Build REST API',
    description: null,
    type: 'FEATURE',
    priority: 'MEDIUM',
    status: 'TODO',
    technicalArea: 'API',
    complexity: null,
    estimatedEffort: null,
    acceptanceCriteria: [],
    implementationPlan: null,
    subtasks: [],
    projectName: 'Demo Project',
    projectDescription: null,
    technologyStack: ['Next.js'],
    ...overrides,
  };
}

describe('mockBreakdown', () => {
  it('suggests subtasks when the task has none', () => {
    const result = mockBreakdown(makeContext());
    expect(result.subtasks.length).toBeGreaterThan(0);
    expect(result.subtasks.length).toBeLessThanOrEqual(8);
    expect(result.subtasks[0].title).toContain('Build REST API');
  });

  it('skips subtasks that already exist on the task (Phase 9 dedupe)', () => {
    const first = mockBreakdown(makeContext());
    const existingTitles = first.subtasks.map((subtask) => subtask.title);

    const second = mockBreakdown(makeContext({ subtasks: existingTitles }));
    expect(second.subtasks).toEqual([]);
  });

  it('is case/whitespace-insensitive when matching existing subtasks', () => {
    const first = mockBreakdown(makeContext());
    const shouty = first.subtasks[0].title.toUpperCase();
    const second = mockBreakdown(makeContext({ subtasks: [`  ${shouty}  `] }));

    expect(
      second.subtasks.some(
        (subtask) => normalizeTitle(subtask.title) === normalizeTitle(first.subtasks[0].title),
      ),
    ).toBe(false);
    expect(second.subtasks).toHaveLength(first.subtasks.length - 1);
  });
});
