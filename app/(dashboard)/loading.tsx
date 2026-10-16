import { cookies } from 'next/headers';
import { InlineLoading } from '@/components/loading/inline-loading';
import { LOADING_STYLE_COOKIE, parseLoadingStyle } from '@/components/loading/loading-style';
import { PageLoading } from '@/components/loading/page-loading';
import { SplashLoading } from '@/components/loading/splash-loading';

// The style is picked in Settings and remembered in a cookie.
// Preview all three at /style-guide.
export default async function Loading() {
  const cookieStore = await cookies();
  const style = parseLoadingStyle(cookieStore.get(LOADING_STYLE_COOKIE)?.value);

  if (style === 'splash') return <SplashLoading />;
  if (style === 'inline') return <InlineLoading />;
  return <PageLoading />;
}
