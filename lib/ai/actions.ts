import { z } from 'zod';
import { taskPriorities, taskStatuses } from '@/lib/validations/task';

export const createTaskActionSchema = z.object({
  type: z.literal('create_task'),
  params: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(taskPriorities).optional(),
  }),
});

export const setStatusActionSchema = z.object({
  type: z.literal('set_task_status'),
  params: z.object({
    taskId: z.string().trim().min(1),
    taskTitle: z.string().trim().max(200).optional(),
    status: z.enum(taskStatuses),
  }),
});

export const chatActionSchema = z.union([createTaskActionSchema, setStatusActionSchema]);

export type ChatAction = z.infer<typeof chatActionSchema>;

const ACTION_FENCE = /```ai-action\s*\n([\s\S]*?)```/g;

export interface ParsedActions {
  actions: ChatAction[];
  cleanContent: string;
}

export function parseActionBlocks(content: string): ParsedActions {
  const actions: ChatAction[] = [];

  const cleanContent = content.replace(ACTION_FENCE, (_match, body: string) => {
    try {
      const parsed = chatActionSchema.safeParse(JSON.parse(body));
      if (parsed.success) {
        actions.push(parsed.data);
      }
    } catch {
      // leave malformed blocks out of the visible text
    }
    return '';
  });

  return { actions, cleanContent: cleanContent.replace(/\n{3,}/g, '\n\n').trim() };
}

export const ACTION_PROMPT_GUIDE = [
  'Proposing actions the user can approve:',
  '- Wrap each proposed action in a fenced block exactly in this form:',
  '```ai-action',
  '{"type":"create_task","params":{"title":"Add login rate limiting","description":"...","priority":"HIGH"}}',
  '```',
  '- Supported actions:',
  '  create_task — params: title (required), description, priority (LOW|MEDIUM|HIGH|CRITICAL).',
  '  set_task_status — params: taskId (required, must be an id from the context task list), taskTitle (optional, for display), status (TODO|IN_PROGRESS|IN_REVIEW|BLOCKED|DONE).',
  '- Propose at most 2 actions per reply, only when they clearly help the user.',
  '- Propose create_task only when a project is bound in the context.',
  '- Never claim an action has already been performed — the user approves it explicitly.',
].join('\n');
