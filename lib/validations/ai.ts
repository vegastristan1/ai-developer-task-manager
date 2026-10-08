import { z } from 'zod';
import { complexities, taskPriorities, taskTypes } from '@/lib/validations/task';

export const breakdownSchema = z.object({
  subtasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(2000).optional(),
        priority: z.enum(taskPriorities).optional(),
        type: z.enum(taskTypes).optional(),
      }),
    )
    .min(1, 'The AI must return at least one subtask')
    .max(8, 'The AI can return at most 8 subtasks'),
});

export const planSectionSchema = z.object({
  title: z.string().trim().min(1).max(80),
  items: z
    .array(z.string().trim().min(1).max(300))
    .min(1)
    .max(10),
});

export const planSchema = z.object({
  sections: z.array(planSectionSchema).min(1).max(10),
});

export const criteriaSchema = z.object({
  criteria: z
    .array(z.string().trim().min(1).max(500))
    .min(1, 'The AI must return at least one criterion')
    .max(15, 'The AI can return at most 15 criteria'),
});

export const estimateSchema = z.object({
  complexity: z.enum(complexities),
  estimatedEffort: z.string().trim().min(1).max(50),
  reasoning: z.string().trim().min(1).max(1500),
});

export const reviewCategories = [
  'security',
  'architecture',
  'edge-case',
  'testing',
  'performance',
] as const;

export const reviewSeverities = ['info', 'warning', 'critical'] as const;

export const reviewSchema = z.object({
  findings: z
    .array(
      z.object({
        category: z.enum(reviewCategories),
        severity: z.enum(reviewSeverities),
        message: z.string().trim().min(1).max(500),
        recommendation: z.string().trim().min(1).max(500),
      }),
    )
    .min(1, 'The AI must return at least one finding')
    .max(12, 'The AI can return at most 12 findings'),
});

export type BreakdownResult = z.infer<typeof breakdownSchema>;
export type PlanResult = z.infer<typeof planSchema>;
export type CriteriaResult = z.infer<typeof criteriaSchema>;
export type EstimateResult = z.infer<typeof estimateSchema>;
export type ReviewResult = z.infer<typeof reviewSchema>;
export type ReviewCategory = (typeof reviewCategories)[number];
export type ReviewSeverity = (typeof reviewSeverities)[number];

export const reviewCategoryLabels: Record<ReviewCategory, string> = {
  security: 'Security',
  architecture: 'Architecture',
  'edge-case': 'Edge cases',
  testing: 'Testing',
  performance: 'Performance',
};

export const reviewSeverityLabels: Record<ReviewSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

export type AiAction = 'breakdown' | 'plan' | 'acceptance-criteria' | 'estimate' | 'review';
