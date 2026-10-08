import { describe, expect, it } from 'vitest';
import { ACTION_PROMPT_GUIDE, parseActionBlocks } from '@/lib/ai/actions';

const CREATE_FENCE = [
  '```ai-action',
  '{"type":"create_task","params":{"title":"Add rate limiting","priority":"HIGH"}}',
  '```',
].join('\n');

const STATUS_FENCE = [
  '```ai-action',
  '{"type":"set_task_status","params":{"taskId":"t1","status":"DONE"}}',
  '```',
].join('\n');

describe('parseActionBlocks', () => {
  it('extracts a valid create_task action', () => {
    const { actions } = parseActionBlocks(`Sure!\n${CREATE_FENCE}`);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({
      type: 'create_task',
      params: { title: 'Add rate limiting', priority: 'HIGH' },
    });
  });

  it('removes fences from the visible content and trims', () => {
    const { cleanContent } = parseActionBlocks(`Intro\n\n${CREATE_FENCE}\n\nOutro`);
    expect(cleanContent).toBe('Intro\n\nOutro');
  });

  it('collects multiple fences in order', () => {
    const { actions } = parseActionBlocks(`${CREATE_FENCE}\n${STATUS_FENCE}`);
    expect(actions.map((action) => action.type)).toEqual(['create_task', 'set_task_status']);
  });

  it('drops malformed JSON without throwing', () => {
    const { actions, cleanContent } = parseActionBlocks('Before\n```ai-action\n{oops\n```\nAfter');
    expect(actions).toEqual([]);
    expect(cleanContent).toBe('Before\n\nAfter');
  });

  it('drops valid JSON that fails the schema', () => {
    const bad = '```ai-action\n{"type":"launch_rocket","params":{}}\n```';
    const { actions } = parseActionBlocks(bad);
    expect(actions).toEqual([]);
  });

  it('drops create_task with an empty title', () => {
    const bad = '```ai-action\n{"type":"create_task","params":{"title":""}}\n```';
    expect(parseActionBlocks(bad).actions).toEqual([]);
  });

  it('returns plain text untouched', () => {
    const text = '  Just a normal reply with no fences.  ';
    const { actions, cleanContent } = parseActionBlocks(text);
    expect(actions).toEqual([]);
    expect(cleanContent).toBe('Just a normal reply with no fences.');
  });

  it('collapses runs of 3+ newlines left behind by removed fences', () => {
    const { cleanContent } = parseActionBlocks(`A\n\n\n${CREATE_FENCE}\n\n\nB`);
    expect(cleanContent).toBe('A\n\nB');
  });
});

describe('ACTION_PROMPT_GUIDE', () => {
  it('documents both actions and the fence format', () => {
    expect(ACTION_PROMPT_GUIDE).toContain('create_task');
    expect(ACTION_PROMPT_GUIDE).toContain('set_task_status');
    expect(ACTION_PROMPT_GUIDE).toContain('```ai-action');
  });
});
