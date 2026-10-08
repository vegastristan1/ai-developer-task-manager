export interface AiTaskContext {
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  technicalArea: string | null;
  complexity: string | null;
  estimatedEffort: string | null;
  acceptanceCriteria: string[];
  implementationPlan: string | null;
  subtasks: string[];
  projectName: string;
  projectDescription: string | null;
  technologyStack: string[];
}

export function formatTaskContext(ctx: AiTaskContext): string {
  const lines = [
    `Project: ${ctx.projectName}`,
    ctx.projectDescription ? `Project description: ${ctx.projectDescription}` : null,
    ctx.technologyStack.length
      ? `Technology stack: ${ctx.technologyStack.join(', ')}`
      : 'Technology stack: not specified',
    '',
    `Task: ${ctx.title}`,
    `Type: ${ctx.type} | Priority: ${ctx.priority} | Status: ${ctx.status}`,
    ctx.technicalArea ? `Technical area: ${ctx.technicalArea}` : null,
    ctx.description ? `Description: ${ctx.description}` : 'Description: not provided',
    ctx.complexity ? `Current complexity: ${ctx.complexity}` : null,
    ctx.estimatedEffort ? `Current estimate: ${ctx.estimatedEffort}` : null,
    ctx.acceptanceCriteria.length
      ? `Existing acceptance criteria: ${ctx.acceptanceCriteria.join(' | ')}`
      : 'Existing acceptance criteria: none',
    ctx.implementationPlan
      ? `Existing implementation plan: ${ctx.implementationPlan}`
      : 'Existing implementation plan: none',
    ctx.subtasks.length
      ? `Existing subtasks: ${ctx.subtasks.join(' | ')}`
      : 'Existing subtasks: none',
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

const JSON_RULE =
  'Respond with a single JSON object only. No prose, no markdown fences, no extra keys.';

export function breakdownPrompts(ctx: AiTaskContext): { system: string; user: string } {
  return {
    system: [
      'You are a senior software engineer who breaks tasks into small, independently completable subtasks.',
      'Return JSON matching: {"subtasks":[{"title":string,"description":string,"priority":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL","type":"FEATURE"|"BUG"|"REFACTOR"|"DOCUMENTATION"|"TESTING"|"DEVOPS"}]}.',
      'title and description are required, priority and type are optional.',
      'Between 2 and 8 subtasks, ordered so dependencies naturally come first. Do not repeat existing subtasks.',
      JSON_RULE,
    ].join('\n'),
    user: `Break the following task into subtasks.\n\n${formatTaskContext(ctx)}`,
  };
}

export function planPrompts(ctx: AiTaskContext): { system: string; user: string } {
  return {
    system: [
      'You are a staff engineer writing implementation plans and architecture guidance.',
      'Return JSON matching: {"sections":[{"title":string,"items":[string]}]}.',
      'Sections cover implementation steps, architecture suggestions and technical recommendations.',
      '2 to 6 sections, each with 1 to 8 concrete items. Keep every item under 300 characters.',
      JSON_RULE,
    ].join('\n'),
    user: `Write an implementation plan for the following task.\n\n${formatTaskContext(ctx)}`,
  };
}

export function criteriaPrompts(ctx: AiTaskContext): { system: string; user: string } {
  return {
    system: [
      'You are a QA engineer writing acceptance criteria in Given/When/Then form where useful.',
      'Return JSON matching: {"criteria":[string]}.',
      '3 to 10 criteria, each testable, specific, and under 500 characters. Do not restate existing criteria.',
      JSON_RULE,
    ].join('\n'),
    user: `Generate acceptance criteria for the following task.\n\n${formatTaskContext(ctx)}`,
  };
}

export function estimatePrompts(ctx: AiTaskContext): { system: string; user: string } {
  return {
    system: [
      'You are a technical lead estimating task complexity and effort.',
      'Return JSON matching: {"complexity":"XS"|"S"|"M"|"L"|"XL","estimatedEffort":string,"reasoning":string}.',
      'estimatedEffort is a human readable range like "4-8h" or "2-3d". reasoning explains the estimate in under 1500 characters.',
      JSON_RULE,
    ].join('\n'),
    user: `Estimate the following task.\n\n${formatTaskContext(ctx)}`,
  };
}

export function reviewPrompts(ctx: AiTaskContext): { system: string; user: string } {
  return {
    system: [
      'You are a senior engineer performing a technical review: security, architecture, edge cases, testing and performance.',
      'Return JSON matching: {"findings":[{"category":"security"|"architecture"|"edge-case"|"testing"|"performance","severity":"info"|"warning"|"critical","message":string,"recommendation":string}]}.',
      '4 to 10 findings, each actionable and specific to the task. message and recommendation are required.',
      JSON_RULE,
    ].join('\n'),
    user: `Review the following task.\n\n${formatTaskContext(ctx)}`,
  };
}
