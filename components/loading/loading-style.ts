export const LOADING_STYLE_COOKIE = 'loading-style';

export const LOADING_STYLES = ['page', 'splash', 'inline'] as const;

export type LoadingStyle = (typeof LOADING_STYLES)[number];

export const LOADING_STYLE_META: Record<LoadingStyle, { label: string; description: string }> = {
  page: {
    label: 'Page',
    description: 'TV mark above a skeleton layout of the page.',
  },
  splash: {
    label: 'Splash',
    description: 'Full-view TV mark with the app name.',
  },
  inline: {
    label: 'Inline',
    description: 'Centered TV mark only.',
  },
};

export function parseLoadingStyle(value: string | null | undefined): LoadingStyle {
  return value === 'splash' || value === 'inline' || value === 'page' ? value : 'page';
}
