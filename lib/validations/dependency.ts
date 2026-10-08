import { z } from 'zod';

export const createDependencySchema = z.object({
  dependsOnId: z.string().trim().min(1, 'Task is required'),
});

export type CreateDependencyInput = z.infer<typeof createDependencySchema>;

export const dependencyReasons = [
  'task-not-found',
  'target-not-found',
  'cross-project',
  'self',
  'duplicate',
  'cycle',
] as const;

export type DependencyReason = (typeof dependencyReasons)[number];

export const dependencyReasonMessages: Record<DependencyReason, string> = {
  'task-not-found': 'Task not found',
  'target-not-found': 'Dependency task not found',
  'cross-project': 'Dependencies must be between tasks in the same project',
  self: 'A task cannot depend on itself',
  duplicate: 'This dependency already exists',
  cycle: 'This dependency would create a circular chain',
};
