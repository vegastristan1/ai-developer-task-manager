import { describe, expect, it } from 'vitest';
import { projectFilterSchema } from '@/lib/validations/project';
import { searchQuerySchema } from '@/lib/validations/search';
import { chatRequestSchema } from '@/lib/validations/chat';
import { breakdownSchema, criteriaSchema } from '@/lib/validations/ai';
import { taskSchema, updateTaskSchema, bulkTaskSchema } from '@/lib/validations/task';

describe('taskSchema', () => {
  it('accepts a minimal task and applies defaults via optional fields', () => {
    const parsed = taskSchema.parse({ title: '  Ship it  ', projectId: 'p1' });
    expect(parsed.title).toBe('Ship it');
    expect(parsed.projectId).toBe('p1');
    expect(parsed.dueDate).toBeNull();
  });

  it('parses due dates as UTC Dates and passes null through', () => {
    expect(taskSchema.parse({ title: 'x', projectId: 'p', dueDate: '2026-03-05' }).dueDate).toEqual(
      new Date('2026-03-05T00:00:00.000Z'),
    );
    expect(taskSchema.parse({ title: 'x', projectId: 'p', dueDate: null }).dueDate).toBeNull();
  });

  it('rejects an empty title', () => {
    expect(taskSchema.safeParse({ title: '   ', projectId: 'p' }).success).toBe(false);
  });

  it('rejects a missing projectId', () => {
    expect(taskSchema.safeParse({ title: 'x' }).success).toBe(false);
  });

  it('rejects unknown enum values', () => {
    expect(taskSchema.safeParse({ title: 'x', projectId: 'p', status: 'NOPE' }).success).toBe(
      false,
    );
    expect(taskSchema.safeParse({ title: 'x', projectId: 'p', priority: 'URGENT' }).success).toBe(
      false,
    );
  });

  it('rejects malformed due dates', () => {
    expect(taskSchema.safeParse({ title: 'x', projectId: 'p', dueDate: 'March 5' }).success).toBe(
      false,
    );
  });

  it('converts an empty acceptance criteria array to null', () => {
    expect(
      taskSchema.parse({ title: 'x', projectId: 'p', acceptanceCriteria: [] }).acceptanceCriteria,
    ).toBeNull();
  });
});

describe('updateTaskSchema', () => {
  it('allows partial updates', () => {
    expect(updateTaskSchema.parse({ status: 'DONE' }).status).toBe('DONE');
    expect(updateTaskSchema.parse({ position: 3 }).position).toBe(3);
  });

  it('rejects an unknown status on update', () => {
    expect(updateTaskSchema.safeParse({ status: 'NOPE' }).success).toBe(false);
  });
});

describe('bulkTaskSchema', () => {
  it('accepts 1-20 tasks', () => {
    const tasks = Array.from({ length: 20 }, (_, index) => ({ title: `Task ${index}` }));
    expect(bulkTaskSchema.safeParse({ projectId: 'p', tasks }).success).toBe(true);
  });

  it('rejects an empty task list and more than 20 tasks', () => {
    expect(bulkTaskSchema.safeParse({ projectId: 'p', tasks: [] }).success).toBe(false);
    const tooMany = Array.from({ length: 21 }, (_, index) => ({ title: `Task ${index}` }));
    expect(bulkTaskSchema.safeParse({ projectId: 'p', tasks: tooMany }).success).toBe(false);
  });
});

describe('searchQuerySchema', () => {
  it('requires a non-empty q', () => {
    expect(searchQuerySchema.safeParse({}).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: '  ' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'schema' }).success).toBe(true);
  });

  it('validates facet enums', () => {
    expect(searchQuerySchema.safeParse({ q: 'x', status: 'DONE' }).success).toBe(true);
    expect(searchQuerySchema.safeParse({ q: 'x', status: 'NOPE' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'x', technicalArea: 'API' }).success).toBe(true);
    expect(searchQuerySchema.safeParse({ q: 'x', technicalArea: 'SIDE' }).success).toBe(false);
  });

  it('rejects queries longer than 200 chars', () => {
    expect(searchQuerySchema.safeParse({ q: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('chatRequestSchema', () => {
  it('trims content', () => {
    expect(chatRequestSchema.parse({ content: '  hello  ' }).content).toBe('hello');
  });

  it('rejects empty and oversized messages', () => {
    expect(chatRequestSchema.safeParse({ content: '' }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ content: 'x'.repeat(4001) }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ content: 'x'.repeat(4000) }).success).toBe(true);
  });

  it('accepts optional conversation and project ids', () => {
    const parsed = chatRequestSchema.parse({
      content: 'hi',
      conversationId: 'c1',
      projectId: 'p1',
    });
    expect(parsed.conversationId).toBe('c1');
    expect(chatRequestSchema.safeParse({ content: 'hi', projectId: null }).success).toBe(true);
  });
});

describe('projectFilterSchema', () => {
  it('is fully optional and validates the status enum', () => {
    expect(projectFilterSchema.safeParse({}).success).toBe(true);
    expect(projectFilterSchema.safeParse({ status: 'ACTIVE' }).success).toBe(true);
    expect(projectFilterSchema.safeParse({ status: 'ARCHIVED' }).success).toBe(true);
    expect(projectFilterSchema.safeParse({ status: 'GONE' }).success).toBe(false);
    expect(projectFilterSchema.safeParse({ q: 'api', status: 'ON_HOLD' }).success).toBe(true);
  });
});

describe('ai schemas', () => {
  it('allows an empty subtask list (Phase 9: min 0)', () => {
    expect(breakdownSchema.safeParse({ subtasks: [] }).success).toBe(true);
  });

  it('rejects more than 8 subtasks', () => {
    const subtasks = Array.from({ length: 9 }, (_, index) => ({ title: `Sub ${index}` }));
    expect(breakdownSchema.safeParse({ subtasks }).success).toBe(false);
  });

  it('rejects a subtask with an empty title', () => {
    expect(breakdownSchema.safeParse({ subtasks: [{ title: '  ' }] }).success).toBe(false);
  });

  it('requires at least one criterion', () => {
    expect(criteriaSchema.safeParse({ criteria: [] }).success).toBe(false);
    expect(criteriaSchema.safeParse({ criteria: ['Works'] }).success).toBe(true);
  });
});
