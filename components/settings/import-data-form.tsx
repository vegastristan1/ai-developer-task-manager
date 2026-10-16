'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface Preview {
  fileName: string;
  projects: number;
  tasks: number;
  conversations: number;
  messages: number;
  exportedAt: string | null;
  payload: unknown;
}

function summarize(fileName: string, parsed: unknown): Preview | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const user = (parsed as { user?: unknown }).user;
  if (typeof user !== 'object' || user === null) return null;
  const { projects, conversations } = user as { projects?: unknown; conversations?: unknown };
  if (!Array.isArray(projects) || !Array.isArray(conversations)) return null;
  let tasks = 0;
  let messages = 0;
  for (const project of projects) {
    const list = (project as { tasks?: unknown }).tasks;
    if (Array.isArray(list)) tasks += list.length;
  }
  for (const conversation of conversations) {
    const list = (conversation as { messages?: unknown }).messages;
    if (Array.isArray(list)) messages += list.length;
  }
  const exportedAt =
    typeof (parsed as { exportedAt?: unknown }).exportedAt === 'string'
      ? (parsed as { exportedAt: string }).exportedAt
      : null;
  return {
    fileName,
    projects: projects.length,
    tasks,
    conversations: conversations.length,
    messages,
    exportedAt,
    payload: parsed,
  };
}

export function ImportDataForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setPreview(null);
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError('File is larger than 5 MB');
      return;
    }
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const summary = summarize(file.name, parsed);
      if (!summary) {
        setError('This file is not a workspace export');
        return;
      }
      setPreview(summary);
    } catch {
      setError('Could not read this file as JSON');
    }
  }

  async function handleImport() {
    if (!preview || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: preview.payload }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 429) {
          setError('Too many imports. Please try again later.');
        } else {
          setError(data?.error ?? 'Could not import this file');
        }
        return;
      }

      const counts = data?.imported;
      toast.success(
        `Imported ${counts?.projects ?? 0} projects, ${counts?.tasks ?? 0} tasks, ${counts?.conversations ?? 0} conversations`,
      );
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } catch {
      setError('Could not import this file');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Restore from export</CardTitle>
        <CardDescription>
          Upload a workspace export file. Everything is added as new items in your current account —
          nothing is deleted.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} />
        {error && <p className="text-destructive text-sm">{error}</p>}
        {preview && (
          <dl className="grid gap-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">File</dt>
              <dd className="font-mono text-xs">{preview.fileName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Projects</dt>
              <dd>{preview.projects}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Tasks</dt>
              <dd>{preview.tasks}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Conversations / messages</dt>
              <dd>
                {preview.conversations} / {preview.messages}
              </dd>
            </div>
            {preview.exportedAt && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Exported</dt>
                <dd>{new Date(preview.exportedAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        )}
        <div>
          <Button type="button" disabled={!preview || isLoading} onClick={handleImport}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Upload />}
            Restore {preview ? `${preview.projects} projects` : 'backup'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
