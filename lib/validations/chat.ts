import { z } from 'zod';

export const chatRequestSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message must be 4000 characters or fewer'),
  conversationId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).nullable().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const conversationQuerySchema = z.object({
  projectId: z.string().trim().min(1, 'projectId cannot be empty').optional(),
});
