import type { NextRequest } from 'next/server';
import { runAiRoute, type AiRouteContext } from '@/lib/ai/action-route';
import { aiReview } from '@/services/ai';

export async function POST(_request: NextRequest, context: AiRouteContext) {
  return runAiRoute(context, aiReview);
}
