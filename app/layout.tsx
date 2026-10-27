import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { SessionProvider } from '@/components/auth/session-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Vercel serves /_vercel/* script paths at the platform level; self-hosted
// builds would 404 them, so only load analytics when deployed on Vercel.
const isVercel = Boolean(process.env.VERCEL);

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-developer-task-manager.vercel.app'),
  title: {
    default: 'AI Developer Task Manager – Plan and Track Dev Work with AI',
    template: '%s | AI Developer Task Manager',
  },
  description:
    'An AI-powered task and project management platform for software developers. Plan sprints, prioritize work, and track progress.',
  keywords: ['developer task manager', 'AI project management', 'sprint planning', 'software teams'],
  robots: { index: false },
  openGraph: {
    title: 'AI Developer Task Manager',
    description: 'AI-powered task and project management for software developers.',
    url: '/',
    siteName: 'AI Developer Task Manager',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Developer Task Manager',
    description: 'AI-powered task and project management for software developers.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <SessionProvider>{children}</SessionProvider>
          </TooltipProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
        {isVercel && <Analytics />}
        {isVercel && <SpeedInsights />}
      </body>
    </html>
  );
}
