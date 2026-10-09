import { z } from 'zod';

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be a valid date (YYYY-MM-DD)')
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const nameField = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or fewer');

const datesValid = (startDate: Date, endDate: Date) => endDate.getTime() >= startDate.getTime();

export const sprintSchema = z
  .object({
    name: nameField,
    goal: nullableText(500),
    startDate: dateField,
    endDate: dateField,
    projectId: z.string().trim().min(1, 'Project is required'),
  })
  .refine((data) => datesValid(data.startDate, data.endDate), {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

export const updateSprintSchema = z
  .object({
    name: nameField.optional(),
    goal: nullableText(500),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
    projectId: z.string().trim().min(1, 'Project is required').optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || datesValid(data.startDate, data.endDate), {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

export type SprintInput = z.infer<typeof sprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;

export const sprintPhases = ['UPCOMING', 'ACTIVE', 'ENDED'] as const;

export type SprintPhase = (typeof sprintPhases)[number];

export const sprintPhaseLabels: Record<SprintPhase, string> = {
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  ENDED: 'Ended',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getSprintPhase(
  startDate: Date | string,
  endDate: Date | string,
  now: Date = new Date(),
): SprintPhase {
  const start = new Date(startDate).getTime();
  const endOfDay = new Date(endDate).getTime() + DAY_MS - 1;

  if (now.getTime() < start) return 'UPCOMING';
  if (now.getTime() > endOfDay) return 'ENDED';
  return 'ACTIVE';
}
