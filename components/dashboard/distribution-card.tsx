import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from 'cn';

export interface DistributionDatum {
  label: string;
  count: number;
  barClassName: string;
}

interface DistributionCardProps {
  title: string;
  description?: string;
  data: DistributionDatum[];
  total: number;
}

export function DistributionCard({ title, description, data, total }: DistributionCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">No data yet.</p>
        ) : (
          data.map((datum) => {
            const percent = total > 0 ? Math.round((datum.count / total) * 100) : 0;
            return (
              <div key={datum.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs font-medium" title={datum.label}>
                  {datum.label}
                </span>
                <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    className={cn('h-full rounded-full', datum.barClassName)}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-16 shrink-0 text-right text-xs whitespace-nowrap tabular-nums">
                  {datum.count} ({percent}%)
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
