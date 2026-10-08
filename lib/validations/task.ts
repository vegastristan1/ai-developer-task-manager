import { z } from 'zod';

export const taskStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'] as const;

export const taskStatusLabels: Record<(typeof taskStatuses)[number], string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

export const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const taskPriorityLabels: Record<(typeof taskPriorities)[number], string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const taskTypes = [
  'FEATURE',
  'BUG',
  'REFACTOR',
  'DOCUMENTATION',
  'TESTING',
  'DEVOPS',
] as const;

export const taskTypeLabels: Record<(typeof taskTypes)[number], string> = {
  FEATURE: 'Feature',
  BUG: 'Bug',
  REFACTOR: 'Refactor',
  DOCUMENTATION: 'Documentation',
  TESTING: 'Testing',
  DEVOPS: 'DevOps',
};

export const technicalAreas = [
  'FRONTEND',
  'BACKEND',
  'DATABASE',
  'API',
  'DEVOPS',
  'TESTING',
  'AI',
] as const;

export const technicalAreaLabels: Record<(typeof technicalAreas)[number], string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  DATABASE: 'Database',
  API: 'API',
  DEVOPS: 'DevOps',
  TESTING: 'Testing',
  AI: 'AI',
};

export const taskSorts = ['position', 'updatedAt', 'priority', 'dueDate', 'title'] as const;

export const taskSortLabels: Record<(typeof taskSorts)[number], string> = {
  position: 'Manual order',
  updatedAt: 'Recently updated',
  priority: 'Priority',
  dueDate: 'Due date',
  title: 'Title',
};

export const complexities = ['XS', 'S', 'M', 'L', 'XL'] as const;

export const complexityLabels: Record<(typeof complexities)[number], string> = {
  XS: 'XS — Trivial',
  S: 'S — Small',
  M: 'M — Medium',
  L: 'L — Large',
  XL: 'XL — Extra large',
};

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: nullableText(5000),
  projectId: z.string().trim().min(1, 'Project is required'),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  type: z.enum(taskTypes).optional(),
  technicalArea: z.enum(technicalAreas).nullable().optional(),
  complexity: z.enum(complexities).nullable().optional(),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be a valid date (YYYY-MM-DD)')
    .nullable()
    .optional()
    .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : null)),
  estimatedEffort: nullableText(50),
  actualEffort: nullableText(50),
  technicalNotes: nullableText(5000),
  acceptanceCriteria: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Criterion cannot be empty')
        .max(500, 'Each criterion must be 500 characters or fewer'),
    )
    .max(50, 'A task can have at most 50 acceptance criteria')
    .optional()
    .transform((value) => (value === undefined ? undefined : value.length ? value : null)),
  labelIds: z.array(z.string().trim().min(1)).max(20).optional(),
});

export const updateTaskSchema = taskSchema.partial().extend({
  position: z.number().finite().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskStatusValue = (typeof taskStatuses)[number];
export type TaskPriorityValue = (typeof taskPriorities)[number];
export type TaskTypeValue = (typeof taskTypes)[number];
export type TechnicalAreaValue = (typeof technicalAreas)[number];
export type ComplexityValue = (typeof complexities)[number];
export type TaskSortValue = (typeof taskSorts)[number];
