import type { z } from 'zod';

export type AiSource = 'openai' | 'mock';

export interface AiResult<T> {
  data: T;
  source: AiSource;
}

export type AiErrorKind = 'not-configured' | 'request-failed' | 'invalid-output';

export class AiError extends Error {
  readonly kind: AiErrorKind;

  constructor(kind: AiErrorKind, message: string) {
    super(message);
    this.name = 'AiError';
    this.kind = kind;
  }
}

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 45_000;

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) return '';
  if (/^your[-_ ]/i.test(value)) return '';
  return value;
}

export function aiConfigured(): { configured: boolean; model: string } {
  const apiKey = readEnv('OPENAI_API_KEY');
  const model = readEnv('OPENAI_MODEL');
  return { configured: !!apiKey && !!model, model };
}

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : content;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new AiError('invalid-output', 'The model response was not valid JSON.');
  }
}

interface ChatJsonOptions<T> {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  mock: () => T;
}

export async function chatJson<T>(options: ChatJsonOptions<T>): Promise<AiResult<T>> {
  const { configured, model } = aiConfigured();

  if (!configured) {
    return { data: options.mock(), source: 'mock' };
  }

  const apiKey = readEnv('OPENAI_API_KEY');

  let response: Response;
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.user },
        ],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new AiError(
      'request-failed',
      error instanceof Error ? error.message : 'The OpenAI request failed.',
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AiError('request-failed', `OpenAI responded with ${response.status}. ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content) {
    throw new AiError('invalid-output', 'OpenAI returned an empty response.');
  }

  const parsed = options.schema.safeParse(extractJson(content));
  if (!parsed.success) {
    throw new AiError('invalid-output', 'OpenAI returned data in an unexpected shape.');
  }

  return { data: parsed.data, source: 'openai' };
}
