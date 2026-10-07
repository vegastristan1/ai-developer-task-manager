import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ExternalLink, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DeleteProjectButton } from '@/components/projects/delete-project-button';
import { ProjectStatusBadge } from '@/components/projects/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSessionUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/utils';
import { getProject } from '@/services/projects';

export const metadata: Metadata = { title: 'Project' };

export const instant = false;

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function ProjectDetailsPage({ params }: ProjectPageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const project = await getProject(id, user.id);

  if (!project) {
    notFound();
  }

  return (
    <>
      <PageHeader title={project.name} description={project.description ?? 'No description yet.'}>
        <Button variant="outline" asChild>
          <Link href={`/projects/${project.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </Button>
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <span className="text-sm font-medium">Repository</span>
              {project.repositoryUrl ? (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex w-fit items-center gap-1.5 text-sm underline-offset-4 hover:underline"
                >
                  {project.repositoryUrl}
                  <ExternalLink className="size-3.5" />
                </a>
              ) : (
                <p className="text-muted-foreground text-sm">No repository linked</p>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium">Technology stack</span>
              {project.technologyStack.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {project.technologyStack.map((technology) => (
                    <span
                      key={technology}
                      className="text-muted-foreground bg-muted rounded-md border px-2 py-1 text-xs"
                    >
                      {technology}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No technologies added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <DetailRow label="Status" value={<ProjectStatusBadge status={project.status} />} />
            <Separator />
            <DetailRow label="Tasks" value={project._count.tasks} />
            <DetailRow label="Sprints" value={project._count.sprints} />
            <DetailRow label="Labels" value={project._count.labels} />
            <Separator />
            <DetailRow label="Created" value={formatDate(project.createdAt)} />
            <DetailRow label="Updated" value={formatDate(project.updatedAt)} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
