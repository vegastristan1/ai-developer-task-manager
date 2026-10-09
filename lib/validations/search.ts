import { z } from 'zod';
import { taskPriorities, taskStatuses, taskTypes, technicalAreas } from '@/lib/validations/task';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(200, 'Query is too long'),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  type: z.enum(taskTypes).optional(),
  technicalArea: z.enum(technicalAreas).optional(),
  projectId: z.string().trim().min(1).optional(),
  sprintId: z.string().trim().min(1).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
