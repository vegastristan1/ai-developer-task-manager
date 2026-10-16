'use server';

import { cookies } from 'next/headers';
import {
  LOADING_STYLE_COOKIE,
  parseLoadingStyle,
  type LoadingStyle,
} from '@/components/loading/loading-style';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setLoadingStyle(style: LoadingStyle) {
  const parsed = parseLoadingStyle(style);
  const cookieStore = await cookies();
  cookieStore.set(LOADING_STYLE_COOKIE, parsed, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  });
  return { ok: true as const, style: parsed };
}
