import { beforeAll, describe, expect, it } from 'vitest';
import { ApiClient, loginClient } from '../helpers/api';

describe('dashboard stats API', () => {
  let client: ApiClient;

  beforeAll(async () => {
    client = await loginClient();
  });

  it('requires authentication', async () => {
    const anon = new ApiClient();
    expect((await anon.get('/api/dashboard/stats')).status).toBe(401);
  });

  it('returns internally consistent stats', async () => {
    const response = await client.get('/api/dashboard/stats');
    expect(response.status).toBe(200);

    const { stats } = response.json;
    const { totals, byStatus, byPriority, byType, recentTasks, blockedTasks } = stats;

    expect(totals.tasks).toBeGreaterThanOrEqual(0);
    expect(totals.open + totals.completed).toBe(totals.tasks);

    const statusSum = byStatus.reduce((sum: number, entry: any) => sum + entry.count, 0);
    expect(statusSum).toBe(totals.tasks);

    const prioritySum = byPriority.reduce((sum: number, entry: any) => sum + entry.count, 0);
    expect(prioritySum).toBe(totals.tasks);

    const typeSum = byType.reduce((sum: number, entry: any) => sum + entry.count, 0);
    expect(typeSum).toBe(totals.tasks);

    expect(totals.completionPercent).toBe(
      totals.tasks === 0 ? 0 : Math.round((totals.completed / totals.tasks) * 100),
    );

    expect(recentTasks.length).toBeLessThanOrEqual(8);
    for (let i = 1; i < recentTasks.length; i += 1) {
      expect(new Date(recentTasks[i - 1].updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(recentTasks[i].updatedAt).getTime(),
      );
    }

    expect(blockedTasks.length).toBeLessThanOrEqual(10);
    for (const task of blockedTasks) {
      expect(task.status).not.toBe('DONE');
      expect(task.blockedBy.length).toBeGreaterThan(0);
    }
  });

  it('exposes a current sprint or null with matching shape', async () => {
    const response = await client.get('/api/dashboard/stats');
    const { currentSprint } = response.json.stats;

    if (currentSprint === null) {
      expect(currentSprint).toBeNull();
    } else {
      expect(typeof currentSprint.name).toBe('string');
      expect(typeof currentSprint.progressPercent).toBe('number');
      expect(currentSprint.completed + currentSprint.remaining).toBe(currentSprint.total);
      expect(new Date(currentSprint.startDate).getTime()).toBeLessThanOrEqual(Date.now());
      expect(new Date(currentSprint.endDate).getTime()).toBeGreaterThanOrEqual(Date.now());
    }
  });

  it('includes the project breakdown with per-project counts', async () => {
    const response = await client.get('/api/dashboard/stats');
    const { projectBreakdown } = response.json.stats;

    expect(Array.isArray(projectBreakdown)).toBe(true);
    for (const project of projectBreakdown) {
      expect(project.completedCount).toBeLessThanOrEqual(project.taskCount);
      expect(project.completionPercent).toBe(
        project.taskCount === 0
          ? 0
          : Math.round((project.completedCount / project.taskCount) * 100),
      );
    }
  });
});
