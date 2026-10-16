'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ExportDataForm({ email }: { email: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/export');
      if (!response.ok) {
        toast.error('Could not export your data');
        return;
      }
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace-export-${email}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Workspace data downloaded');
    } catch {
      toast.error('Could not export your data');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Export your data</CardTitle>
        <CardDescription>
          Download everything in your workspace — profile, projects, tasks, sprints, labels, and AI
          conversations — as one JSON file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" disabled={isLoading} onClick={handleExport}>
          {isLoading ? <Loader2 className="animate-spin" /> : <Download />}
          Download JSON export
        </Button>
      </CardContent>
    </Card>
  );
}
