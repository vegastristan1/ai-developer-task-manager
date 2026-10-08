import type { z } from 'zod';
import { aiConfigured, chatJson, type AiSource } from '@/lib/ai/client';
import { mockBreakdown, mockCriteria, mockEstimate, mockPlan, mockReview } from '@/lib/ai/mocks';
import {
  breakdownPrompts,
  criteriaPrompts,
  estimatePrompts,
  planPrompts,
  reviewPrompts,
  type AiTaskContext,
} from '@/lib/ai/prompts';
import { prisma } from '@/lib/db/prisma';
import {
  breakdownSchema,
  criteriaSchema,
  estimateSchema,
  planSchema,
  reviewSchema,
  type BreakdownResult,
  type CriteriaResult,
  type EstimateResult,
  type PlanResult,
  type ReviewResult,
} from '@/lib/validations/ai';
import { getTask, type TaskDetails } from '@/services/tasks';

export type AiServiceResult<T> =
  | { ok: true; data: T; source: AiSource; model: string }
  | { ok: false; reason: 'task-not-found' };

function toStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

async function loadContext(
  taskId: string,
  userId: string,
): Promise<{ task: TaskDetails; ctx: AiTaskContext } | null> {
  const task = await getTask(taskId, userId);
  if (!task) return null;

  const project = await prisma.project.findFirst({
    where: { id: task.projectId, userId },
    select: { name: true, description: true, technologyStack: true },
  });
  if (!project) return null;

  const ctx: AiTaskContext = {
    title: task.title,
    description: task.description,
    type: task.type,
    priority: task.priority,
    status: task.status,
    technicalArea: task.technicalArea,
    complexity: task.complexity,
    estimatedEffort: task.estimatedEffort,
    acceptanceCriteria: toStringList(task.acceptanceCriteria),
    implementationPlan: task.implementationPlan,
    subtasks: task.subtasks.map((subtask) => subtask.title),
    projectName: project.name,
    projectDescription: project.description,
    technologyStack: project.technologyStack,
  };

  return { task, ctx };
}

async function runAction<T>(
  taskId: string,
  userId: string,
  build: (ctx: AiTaskContext) => { system: string; user: string },
  schema: z.ZodType<T>,
  mock: (ctx: AiTaskContext) => T,
): Promise<AiServiceResult<T>> {
  const loaded = await loadContext(taskId, userId);
  if (!loaded) return { ok: false, reason: 'task-not-found' };

  const { system, user } = build(loaded.ctx);
  const result = await chatJson({
    system,
    user,
    schema,
    mock: () => mock(loaded.ctx),
  });

  return { ok: true, data: result.data, source: result.source, model: aiConfigured().model };
}

export function aiBreakdown(taskId: string, userId: string): Promise<AiServiceResult<BreakdownResult>> {
  return runAction(taskId, userId, breakdownPrompts, breakdownSchema, mockBreakdown);
}

export function aiPlan(taskId: string, userId: string): Promise<AiServiceResult<PlanResult>> {
  return runAction(taskId, userId, planPrompts, planSchema, mockPlan);
}

export function aiCriteria(taskId: string, userId: string): Promise<AiServiceResult<CriteriaResult>> {
  return runAction(taskId, userId, criteriaPrompts, criteriaSchema, mockCriteria);
}

export function aiEstimate(taskId: string, userId: string): Promise<AiServiceResult<EstimateResult>> {
  return runAction(taskId, userId, estimatePrompts, estimateSchema, mockEstimate);
}

export function aiReview(taskId: string, userId: string): Promise<AiServiceResult<ReviewResult>> {
  return runAction(taskId, userId, reviewPrompts, reviewSchema, mockReview);
}
