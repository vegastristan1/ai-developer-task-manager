import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { chatJson } from '@/lib/ai/client';

const schema = z.object({ greeting: z.string() });

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('chatJson base URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses OPENAI_BASE_URL when set and tolerates a trailing slash', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('OPENAI_MODEL', 'test-model');
    vi.stubEnv('OPENAI_BASE_URL', 'https://groq.example/v1/');
    const fetchMock = vi.fn(async () =>
      jsonResponse({ choices: [{ message: { content: '{"greeting":"hi"}' } }] }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await chatJson({
      system: 'sys',
      user: 'usr',
      schema,
      mock: () => ({ greeting: 'mock' }),
    });

    expect(result.source).toBe('openai');
    expect(result.data).toEqual({ greeting: 'hi' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toBe('https://groq.example/v1/chat/completions');
    const payload = JSON.parse(String(call[1].body)) as { model: string; max_tokens: number };
    expect(payload.model).toBe('test-model');
    expect(payload.max_tokens).toBe(768);
  });

  it('falls back to the default OpenAI URL when OPENAI_BASE_URL is unset', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('OPENAI_MODEL', 'test-model');
    vi.stubEnv('OPENAI_BASE_URL', '');
    const fetchMock = vi.fn(async () =>
      jsonResponse({ choices: [{ message: { content: '{"greeting":"hi"}' } }] }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await chatJson({ system: 's', user: 'u', schema, mock: () => ({ greeting: 'mock' }) });

    const call = fetchMock.mock.calls[0] as unknown as [string];
    expect(call[0]).toBe('https://api.openai.com/v1/chat/completions');
  });

  it('returns mock data without calling fetch when not configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('OPENAI_MODEL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await chatJson({
      system: 's',
      user: 'u',
      schema,
      mock: () => ({ greeting: 'mock' }),
    });

    expect(result.source).toBe('mock');
    expect(result.data).toEqual({ greeting: 'mock' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
