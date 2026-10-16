'use client';

import { useEffect, useState } from 'react';
import { cn } from 'cn';

const DEFAULT_MESSAGES = [
  'Getting things ready…',
  'Loading projects…',
  'Loading tasks…',
  'Almost there…',
];

/**
 * Cycling loading status line. Renders the first message on the server so
 * hydration matches, then advances on the client only.
 */
export function LoadingMessage({
  messages = DEFAULT_MESSAGES,
  intervalMs = 1600,
  className,
}: {
  messages?: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, messages.length]);

  return (
    <span aria-live="polite" className={cn('text-muted-foreground text-sm', className)}>
      {messages[index] ?? messages[0]}
    </span>
  );
}
