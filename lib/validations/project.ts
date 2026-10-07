import { z } from 'zod';

export const projectStatuses = ['ACTIVE', 'ON_HOLD', 'ARCHIVED'] as const;

export const projectStatusLabels: Record<(typeof projectStatuses)[number], string> = {
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  ARCHIVED: 'Archived',
};

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be 2000 characters or fewer')
    .optional()
    .transform((value) => (value ? value : undefined)),
  repositoryUrl: z
    .string()
    .trim()
    .max(500, 'Repository URL must be 500 characters or fewer')
    .optional()
    .refine((value) => !value || URL.canParse(value), 'Repository URL must be a valid URL')
    .transform((value) => (value ? value : undefined)),
  technologyStack: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Technology cannot be empty')
        .max(40, 'Each technology must be 40 characters or fewer'),
    )
    .max(20, 'A project can have at most 20 technologies')
    .optional(),
  status: z.enum(projectStatuses).optional(),
});

export const updateProjectSchema = projectSchema.partial();

export type ProjectInput = z.infer<typeof projectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectStatusValue = (typeof projectStatuses)[number];
