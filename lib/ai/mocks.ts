import type {
  BreakdownResult,
  CriteriaResult,
  EstimateResult,
  PlanResult,
  ReviewResult,
} from '@/lib/validations/ai';
import type { AiTaskContext } from '@/lib/ai/prompts';
import { normalizeTitle } from '@/lib/utils';

function base(title: string): string {
  return title.replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function mockBreakdown(ctx: AiTaskContext): BreakdownResult {
  const title = base(ctx.title);
  const existing = new Set(ctx.subtasks.map((subtask) => normalizeTitle(subtask)));
  const suggestions: BreakdownResult['subtasks'] = [
    {
      title: `Clarify requirements and scope for ${title}`,
      description: 'Document edge cases, inputs, outputs and acceptance boundaries before coding.',
      priority: 'HIGH',
      type: 'DOCUMENTATION',
    },
    {
      title: `Implement core logic for ${title}`,
      description: 'Build the primary code path with validation and error handling.',
      priority: 'HIGH',
      type: 'FEATURE',
    },
    {
      title: `Add automated tests for ${title}`,
      description: 'Cover happy path, validation failures and edge cases.',
      priority: 'MEDIUM',
      type: 'TESTING',
    },
    {
      title: `Review and document ${title}`,
      description: 'Self-review the diff, update technical notes and verify acceptance criteria.',
      priority: 'MEDIUM',
      type: 'REFACTOR',
    },
  ];

  return {
    subtasks: suggestions.filter((suggestion) => !existing.has(normalizeTitle(suggestion.title))),
  };
}

export function mockPlan(ctx: AiTaskContext): PlanResult {
  const title = base(ctx.title);
  const stack = ctx.technologyStack.length ? ctx.technologyStack.join(', ') : 'the project stack';
  return {
    sections: [
      {
        title: `Understanding ${title}`,
        items: [
          'Confirm scope, inputs, outputs and non-goals with the task description.',
          `Align the approach with ${stack}.`,
          'List risks and open questions before writing code.',
        ],
      },
      {
        title: 'Architecture suggestions',
        items: [
          'Keep business logic in a service layer and route handlers thin.',
          'Reuse existing validation schemas instead of duplicating rules.',
          'Separate read paths from write paths where the codebase already does so.',
        ],
      },
      {
        title: 'Implementation steps',
        items: [
          'Add or extend Zod schemas for all new inputs.',
          'Implement the service function with authorization and validation checks.',
          'Expose the functionality through an API route returning documented status codes.',
          'Wire the UI, showing loading, empty and error states.',
        ],
      },
      {
        title: 'Technical recommendations',
        items: [
          'Add indexes for any new query filters.',
          'Cover the change with unit and integration tests.',
          'Document behaviour in the plan notes before handoff.',
        ],
      },
    ],
  };
}

export function mockCriteria(ctx: AiTaskContext): CriteriaResult {
  const title = base(ctx.title);
  return {
    criteria: [
      `Given a signed-in user, when they ${title.toLowerCase()}, then the result is persisted and returned with a 201 status.`,
      'Given invalid input, when the request is submitted, then a 422 response lists every failed field.',
      'Given an unauthenticated request, when it reaches the API, then it is rejected with 401.',
      'Given a resource from another user, when it is requested, then it is not found for the caller.',
      `Given ${title} succeeds, when the page reloads, then the updated state is still shown.`,
      'Given the AI or upstream service is unavailable, when the action runs, then a clear error is shown and no partial data is saved.',
    ],
  };
}

export function mockEstimate(ctx: AiTaskContext): EstimateResult {
  const title = base(ctx.title);
  return {
    complexity: 'M',
    estimatedEffort: '4-8h',
    reasoning: `${title} spans validation, persistence and UI work across the existing stack${
      ctx.technologyStack.length ? ` (${ctx.technologyStack.join(', ')})` : ''
    }, but stays within known patterns, so it is moderate rather than complex.`,
  };
}

export function mockReview(ctx: AiTaskContext): ReviewResult {
  const title = base(ctx.title);
  return {
    findings: [
      {
        category: 'security',
        severity: 'warning',
        message: `${title} must verify ownership before returning or mutating data.`,
        recommendation:
          'Scope every query by the authenticated user and return 404 for foreign records.',
      },
      {
        category: 'architecture',
        severity: 'info',
        message: 'Logic should live in the service layer, not inside route handlers.',
        recommendation:
          'Keep the route handler to auth, parsing, service call and response mapping.',
      },
      {
        category: 'edge-case',
        severity: 'warning',
        message: 'Concurrent requests can produce duplicate or conflicting writes.',
        recommendation: 'Use a transaction and unique constraints where ordering matters.',
      },
      {
        category: 'testing',
        severity: 'info',
        message: `No automated coverage yet for ${title}.`,
        recommendation: 'Add tests for happy path, validation failures and authorization denial.',
      },
      {
        category: 'performance',
        severity: 'info',
        message: 'Unbounded list queries will slow down as data grows.',
        recommendation: 'Add pagination and an index on the primary sort field.',
      },
    ],
  };
}
