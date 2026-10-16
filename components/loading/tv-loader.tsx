import { cn } from 'cn';

interface TvLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  caption?: string;
  className?: string;
}

const tileSizes = {
  sm: 'size-10 text-base',
  md: 'size-14 text-xl',
  lg: 'size-20 text-3xl',
} as const;

const tileRounded = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
} as const;

/**
 * Branded "TV" (Tristan Vegas) loading mark: primary tile with a soft ping
 * ring and a shimmer sweep. Pure CSS — safe to render during Suspense.
 */
export function TvLoader({ size = 'md', caption, className }: TvLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)} role="status">
      <span className={cn('relative inline-flex', tileRounded[size])}>
        <span
          className="bg-primary/30 absolute inset-0 animate-ping rounded-[inherit] [animation-duration:1.6s]"
          aria-hidden
        />
        <span
          className={cn(
            'bg-primary text-primary-foreground relative flex items-center justify-center font-semibold tracking-tight',
            tileSizes[size],
            tileRounded[size],
          )}
          aria-hidden
        >
          <span className="relative overflow-hidden">
            TV
            <span
              className="animate-shimmer absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              aria-hidden
            />
          </span>
        </span>
      </span>
      {caption && <span className="text-muted-foreground text-sm">{caption}</span>}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
