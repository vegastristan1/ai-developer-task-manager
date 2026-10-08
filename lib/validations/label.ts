import { z } from 'zod';

export const labelColors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
] as const;

export const labelSchema = z.object({
  projectId: z.string().trim().min(1, 'Project is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Label name is required')
    .max(40, 'Label name must be 40 characters or fewer'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex color like #3b82f6')
    .optional(),
});

export const updateLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Label name is required')
    .max(40, 'Label name must be 40 characters or fewer')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex color like #3b82f6')
    .optional(),
});

export type LabelInput = z.infer<typeof labelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

export const labelQuerySchema = z.object({
  projectId: z.string().trim().min(1, 'projectId is required'),
});
