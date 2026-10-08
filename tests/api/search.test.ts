import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loginClient, type ApiClient } from '../helpers/api';

describe('search API', () => {
  let client: ApiClient;
  let projectId: string;
  const token = `srch${Date.now()}`;

  beforeAll(async () => {
    client = await loginClient();

    const project = await client.post('/api/projects', {
      name: `Vitest Search Widget ${token}`,
      description: 'A searchable fixture project',
    });
    expect(project.status).toBe(201);
    projectId = project.json.project.id;

    const task = await client.post('/api/tasks', {
      title: `${token} implement fuzzy matching`,
      projectId,
      status: 'DONE',
      priority: 'HIGH',
      type: 'FEATURE',
      technicalArea: 'BACKEND',
    });
    expect(task.status).toBe(201);

    await client.post('/api/labels', {
      name: `${token} label`,
      projectId,
      color: '#ff0000',
    });
  });

  afterAll(async () => {
    await client.delete(`/api/projects/${projectId}`);
  });

  it('requires a query with 422 otherwise', async () => {
    expect((await client.get('/api/search')).status).toBe(422);
    expect((await client.get('/api/search?q=%20%20')).status).toBe(422);
    expect((await client.get('/api/search?q=anything&status=NOPE')).status).toBe(422);
  });

  it('returns grouped results with counts', async () => {
    const response = await client.get(`/api/search?q=${token}`);
    expect(response.status).toBe(200);

    const { results } = response.json;
    expect(results.query).toBe(token);
    expect(results.counts.tasks).toBeGreaterThanOrEqual(1);
    expect(results.counts.labels).toBeGreaterThanOrEqual(1);

    const task = results.tasks.find((entry: any) => entry.title.includes('fuzzy matching'));
    expect(task).toBeTruthy();
    expect(task.status).toBe('DONE');
    expect(task.project.id).toBe(projectId);

    const project = results.projects.find((entry: any) => entry.id === projectId);
    expect(project).toBeTruthy();

    const label = results.labels.find((entry: any) => entry.name.includes(token));
    expect(label).toBeTruthy();
  });

  it('filters results by facets', async () => {
    const matching = await client.get(`/api/search?q=fuzzy&status=DONE&projectId=${projectId}`);
    expect(matching.status).toBe(200);
    expect(
      matching.json.results.tasks.every((task: any) => task.status === 'DONE'),
    ).toBe(true);

    const wrongStatus = await client.get(`/api/search?q=fuzzy&status=BLOCKED&projectId=${projectId}`);
    expect(wrongStatus.status).toBe(200);
    expect(wrongStatus.json.results.tasks).toHaveLength(0);

    // Facets (projectId, status, ...) narrow the task results only.
    const wrongProject = await client.get(
      `/api/search?q=${token}&projectId=does-not-exist`,
    );
    expect(wrongProject.status).toBe(200);
    expect(wrongProject.json.results.tasks).toHaveLength(0);
    expect(
      wrongProject.json.results.projects.some((entry: any) => entry.id === projectId),
    ).toBe(true);
  });

  it('returns empty results for a query that matches nothing', async () => {
    const response = await client.get('/api/search?q=zzzz-no-such-thing-zzzz');
    expect(response.status).toBe(200);
    expect(response.json.results.counts).toEqual({ projects: 0, tasks: 0, labels: 0 });
    expect(response.json.results.tasks).toHaveLength(0);
  });
});
