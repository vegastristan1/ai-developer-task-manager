import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <Bot className="size-4" />
        </div>
        <span className="text-base">AI Developer Task Manager</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
