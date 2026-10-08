// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { DistributionCard, type DistributionDatum } from '@/components/dashboard/distribution-card';

describe('MetricCard', () => {
  it('renders label, value, and hint', () => {
    render(<MetricCard label="Open tasks" value={42} hint="across 3 projects" icon={<span data-testid="icon" />} />);
    expect(screen.getByText('Open tasks')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('across 3 projects')).toBeTruthy();
    expect(screen.getByTestId('icon')).toBeTruthy();
  });

  it('omits the hint when not provided', () => {
    render(<MetricCard label="Done" value="100%" icon={<span />} />);
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.queryByText(/hint/)).toBeNull();
  });
});

describe('DistributionCard', () => {
  const data: DistributionDatum[] = [
    { label: 'To do', count: 3, barClassName: 'bg-blue-500' },
    { label: 'Done', count: 1, barClassName: 'bg-emerald-500' },
  ];

  it('renders title, rows, counts, and percents', () => {
    render(<DistributionCard title="By status" data={data} total={4} />);
    expect(screen.getByText('By status')).toBeTruthy();
    expect(screen.getByText('To do')).toBeTruthy();
    expect(screen.getByText('3 (75%)')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('1 (25%)')).toBeTruthy();
  });

  it('shows an empty message when there is no data', () => {
    render(<DistributionCard title="By area" data={[]} total={0} />);
    expect(screen.getByText('No data yet.')).toBeTruthy();
  });

  it('shows 0% rows without dividing by zero', () => {
    render(<DistributionCard title="By type" data={data} total={0} />);
    expect(screen.getByText('3 (0%)')).toBeTruthy();
    expect(screen.getAllByText(/0%/).length).toBeGreaterThan(0);
  });

  it('renders the optional description', () => {
    render(<DistributionCard title="T" description="Breakdown of tasks" data={[]} total={0} />);
    expect(screen.getByText('Breakdown of tasks')).toBeTruthy();
  });
});
