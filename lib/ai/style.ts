export const AI_TONES = ['CONCISE', 'BALANCED', 'DETAILED'] as const;

export type AiTone = (typeof AI_TONES)[number];

const DIRECTIVES: Record<AiTone, string> = {
  CONCISE:
    'Keep every answer as short as possible: short sentences, no examples unless asked, no filler.',
  BALANCED: 'Balance brevity and detail: structured when it helps, no unnecessary elaboration.',
  DETAILED:
    'Be thorough: explain reasoning step by step, include relevant examples and edge cases.',
};

export function resolveTone(input: string | null | undefined): AiTone {
  return (AI_TONES as readonly string[]).includes(input ?? '') ? (input as AiTone) : 'BALANCED';
}

/** Appends the user's style preference to a system prompt. */
export function withTone(system: string, tone: AiTone): string {
  return `${system}\nResponse style: ${DIRECTIVES[tone]}`;
}
