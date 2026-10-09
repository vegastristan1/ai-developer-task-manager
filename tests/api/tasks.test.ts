import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loginClient, uniqueName, type ApiClient } from '../helpers/api';

describe('tasks API', () => {
  let client: ApiClient;
  let projectId: string;
  let otherProjectId: string;
  let otherTaskId: string;
  let otherClient: ApiClient;
  const runId = Date.now();

  beforeAll(async () => {
    client = await loginClient();

    const project = await client.post('/api/projects', {
      name: uniqueName('Vitest Tasks'),
      description: 'Fixture project for task API tests',
    });
    expect(project.status).toBe(201);
    projectId = project.json.project.id;

    otherClient = await loginClient('vitest-other@example.com');
    const otherProject = await otherClient.post('/api/projects', {
      name: uniqueName('Vitest Other'),
    });
    expect(otherProject.status).toBe(201);
    otherProjectId = otherProject.json.project.id;

    const otherTask = await otherClient.post('/api/tasks', {
      title: `Other users task ${runId}`,
      projectId: otherProjectId,
    });
    expect(otherTask.status).toBe(201);
    otherTaskId = otherTask.json.task.id;
  });

  afterAll(async () => {
    await client.delete(`/api/projects/${projectId}`);
    await otherClient.delete(`/api/projects/${otherProjectId}`);
  });

  it('creates a task with full fields', async () => {
    const response = await client.post('/api/tasks', {
      title: 'Design PostgreSQL schema',
      description: 'Core entities',
      projectId,
      priority: 'HIGH',
      type: 'FEATURE',
      technicalArea: 'DATABASE',
      dueDate: '2026-12-01',
    });
    expect(response.status).toBe(201);
    const task = response.json.task;
    expect(task.title).toBe('Design PostgreSQL schema');
    expect(task.status).toBe('TODO');
    expect(task.priority).toBe('HIGH');
    expect(task.technicalArea).toBe('DATABASE');
    expect(task.dueDate).toBeTruthy();

    const fetched = await client.get(`/api/tasks/${task.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.json.task.id).toBe(task.id);
  });

  it('applies defaults for optional fields', async () => {
    const response = await client.post('/api/tasks', {
      title: `Minimal task ${runId}`,
      projectId,
    });
    expect(response.status).toBe(201);
    expect(response.json.task.status).toBe('TODO');
    expect(response.json.task.priority).toBe('MEDIUM');
    expect(response.json.task.type).toBe('FEATURE');
  });

  it('rejects invalid payloads with 422', async () => {
    expect((await client.post('/api/tasks', {})).status).toBe(422);
    expect((await client.post('/api/tasks', { title: 'No project' })).status).toBe(422);
    expect(
      (await client.post('/api/tasks', { title: 'x', projectId, status: 'NOPE' })).status,
    ).toBe(422);
    expect(
      (await client.post('/api/tasks', { title: 'x', projectId, dueDate: 'not-a-date' })).status,
    ).toBe(422);
  });

  it('filters the task list', async () => {
    const token = `filter-${runId}`;
    const a = await client.post('/api/tasks', {
      title: `${token} alpha`,
      projectId,
      priority: 'HIGH',
      technicalArea: 'API',
      type: 'BUG',
    });
    const b = await client.post('/api/tasks', { title: `${token} beta`, projectId });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    await client.put(`/api/tasks/${b.json.task.id}`, { status: 'DONE' });

    const byArea = await client.get(
      `/api/tasks?projectId=${projectId}&technicalArea=API&q=${token}`,
    );
    expect(byArea.status).toBe(200);
    expect(byArea.json.tasks.map((task: any) => task.title)).toEqual([`${token} alpha`]);

    const byPriority = await client.get(
      `/api/tasks?projectId=${projectId}&priority=HIGH&q=${token}`,
    );
    expect(byPriority.json.tasks.map((task: any) => task.id)).toEqual([a.json.task.id]);

    const byStatus = await client.get(`/api/tasks?projectId=${projectId}&status=DONE&q=${token}`);
    expect(byStatus.json.tasks.map((task: any) => task.id)).toEqual([b.json.task.id]);

    const bySearch = await client.get(`/api/tasks?projectId=${projectId}&q=${token}`);
    expect(bySearch.json.tasks).toHaveLength(2);

    await client.delete(`/api/tasks/${a.json.task.id}`);
    await client.delete(`/api/tasks/${b.json.task.id}`);
  });

  it('rejects invalid filters with 422', async () => {
    expect((await client.get('/api/tasks?status=NOPE')).status).toBe(422);
    expect((await client.get('/api/tasks?technicalArea=SIDE')).status).toBe(422);
  });

  it('updates a task', async () => {
    const created = await client.post('/api/tasks', { title: `Update me ${runId}`, projectId });
    const id = created.json.task.id;

    const updated = await client.put(`/api/tasks/${id}`, {
      status: 'IN_REVIEW',
      title: `Updated task ${runId}`,
    });
    expect(updated.status).toBe(200);
    expect(updated.json.task.status).toBe('IN_REVIEW');
    expect(updated.json.task.title).toBe(`Updated task ${runId}`);

    await client.delete(`/api/tasks/${id}`);
  });

  it('returns 404 for unknown tasks', async () => {
    expect((await client.get('/api/tasks/nonexistent-id')).status).toBe(404);
    expect((await client.put('/api/tasks/nonexistent-id', { status: 'DONE' })).status).toBe(404);
    expect((await client.delete('/api/tasks/nonexistent-id')).status).toBe(404);
  });

  it('deduplicates bulk creates (Phase 9)', async () => {
    const first = await client.post('/api/tasks/bulk', {
      projectId,
      tasks: [
        { title: `Bulk Dup ${runId}` },
        { title: `  bulk   dup ${runId} ` },
        { title: `BULK DUP ${runId}` },
        { title: `Bulk unique ${runId}` },
      ],
    });
    expect(first.status).toBe(201);
    expect(first.json.tasks).toHaveLength(2);
    expect(first.json.skipped).toHaveLength(2);

    const second = await client.post('/api/tasks/bulk', {
      projectId,
      tasks: [{ title: `bulk dup ${runId}` }, { title: `BULK   DUP ${runId}` }],
    });
    expect(second.status).toBe(201);
    expect(second.json.tasks).toHaveLength(0);
    expect(second.json.skipped).toHaveLength(2);

    const list = await client.get(`/api/tasks?projectId=${projectId}&q=${runId}`);
    const bulkTitles = list.json.tasks.map((task: any) => task.title);
    expect(bulkTitles).toContain(`Bulk Dup ${runId}`);
    expect(bulkTitles).toContain(`Bulk unique ${runId}`);
    expect(
      bulkTitles.filter((title: string) => title.toLowerCase().includes('bulk dup')),
    ).toHaveLength(1);

    for (const task of list.json.tasks) {
      await client.delete(`/api/tasks/${task.id}`);
    }
  });

  it('rejects bulk payloads with more than 20 tasks', async () => {
    const tasks = Array.from({ length: 21 }, (_, index) => ({ title: `Too many ${index}` }));
    expect((await client.post('/api/tasks/bulk', { projectId, tasks })).status).toBe(422);
    expect((await client.post('/api/tasks/bulk', { projectId, tasks: [] })).status).toBe(422);
  });

  it("returns 404 for another user's resources", async () => {
    expect((await client.get(`/api/projects/${otherProjectId}`)).status).toBe(404);
    expect((await client.get(`/api/tasks/${otherTaskId}`)).status).toBe(404);
    expect((await client.put(`/api/tasks/${otherTaskId}`, { status: 'DONE' })).status).toBe(404);
    expect((await client.delete(`/api/tasks/${otherTaskId}`)).status).toBe(404);
  });

  it('deletes a task', async () => {
    const created = await client.post('/api/tasks', { title: `Delete me ${runId}`, projectId });
    const id = created.json.task.id;
    expect((await client.delete(`/api/tasks/${id}`)).status).toBe(200);
    expect((await client.get(`/api/tasks/${id}`)).status).toBe(404);
  });
});
