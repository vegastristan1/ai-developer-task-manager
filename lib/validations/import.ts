import { z } from 'zod';

const labelSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  color: z.string().max(32),
});

const sprintSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  goal: z.string().max(2000).nullable(),
  startDate: z.string(),
  endDate: z.string(),
});

const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().max(20000).nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  type: z.enum(['FEATURE', 'BUG', 'REFACTOR', 'DOCUMENTATION', 'TESTING', 'DEVOPS']),
  technicalArea: z
    .enum(['FRONTEND', 'BACKEND', 'DATABASE', 'API', 'DEVOPS', 'TESTING', 'AI'])
    .nullable(),
  complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']).nullable(),
  estimatedEffort: z.string().max(100).nullable(),
  actualEffort: z.string().max(100).nullable(),
  dueDate: z.string().nullable(),
  // `position` and `dependencies` were added to exports later — old files omit
  // them, so default instead of rejecting.
  position: z.number().optional().default(0),
  implementationPlan: z.string().max(50000).nullable(),
  acceptanceCriteria: z.unknown(),
  technicalNotes: z.string().max(20000).nullable(),
  sprintId: z.string().nullable(),
  parentTaskId: z.string().nullable(),
  labels: z
    .array(z.object({ label: z.object({ name: z.string().min(1), color: z.string() }) }))
    .max(50)
    .optional()
    .default([]),
  dependencies: z
    .array(z.object({ dependsOnId: z.string() }))
    .max(100)
    .optional()
    .default([]),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).nullable(),
  repositoryUrl: z.string().max(2048).nullable(),
  technologyStack: z.array(z.string().max(100)).max(50),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'ARCHIVED']),
  labels: z.array(labelSchema).max(200),
  sprints: z.array(sprintSchema).max(200),
  tasks: z.array(taskSchema).max(2000),
});

const conversationSchema = z.object({
  id: z.string(),
  title: z.string().max(500).nullable(),
  projectId: z.string().nullable(),
  messages: z
    .array(
      z.object({
        role: z.enum(['USER', 'ASSISTANT']),
        content: z.string().min(1).max(50000),
      }),
    )
    .max(2000),
});

export const importSchema = z.object({
  data: z.object({
    user: z.object({
      projects: z.array(projectSchema).max(200),
      conversations: z.array(conversationSchema).max(200),
    }),
  }),
});

export type ImportInput = z.infer<typeof importSchema>;
