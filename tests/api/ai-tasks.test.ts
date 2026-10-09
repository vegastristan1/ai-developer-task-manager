import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiClient, loginClient, uniqueName } from '../helpers/api';

describe('AI task tools API', () => {
  let client: ApiClient;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    client = await loginClient();

    const project = await client.post('/api/projects', {
      name: uniqueName('Vitest AI'),
      description: 'Fixture project for AI tool tests',
      technologyStack: ['Next.js', 'Prisma'],
    });
    expect(project.status).toBe(201);
    projectId = project.json.project.id;

    const task = await client.post('/api/tasks', {
      title: 'Build REST API for projects and tasks',
      description: 'CRUD endpoints with validation',
      projectId,
      type: 'FEATURE',
      technicalArea: 'API',
    });
    expect(task.status).toBe(201);
    taskId = task.json.task.id;
  });

  afterAll(async () => {
    await client.delete(`/api/projects/${projectId}`);
  });

  it('requires authentication for AI routes', async () => {
    const anon = new ApiClient();
    expect((await anon.post(`/api/ai/tasks/${taskId}/breakdown`, {})).status).toBe(401);
    expect((await anon.post(`/api/ai/tasks/${taskId}/plan`, {})).status).toBe(401);
  });

  it("returns 404 for another user's task", async () => {
    const other = await loginClient('vitest-other@example.com');
    const response = await other.post(`/api/ai/tasks/${taskId}/breakdown`, {});
    expect(response.status).toBe(404);
  });

  it('returns mock breakdown subtasks with source metadata', async () => {
    const response = await client.post(`/api/ai/tasks/${taskId}/breakdown`, {});
    expect(response.status).toBe(200);
    expect(response.json.source).toBe('mock');
    expect(response.json.data.subtasks.length).toBeGreaterThan(0);
    expect(response.json.data.subtasks.length).toBeLessThanOrEqual(8);
    for (const subtask of response.json.data.subtasks) {
      expect(subtask.title).toContain('Build REST API for projects and tasks');
      expect(subtask.title.length).toBeLessThanOrEqual(200);
    }
  });

  it('skips already-created subtasks on re-run (Phase 9 dedupe)', async () => {
    const first = await client.post(`/api/ai/tasks/${taskId}/breakdown`, {});
    expect(first.status).toBe(200);
    const suggested = first.json.data.subtasks;
    expect(suggested.length).toBeGreaterThan(0);

    const accept = await client.post('/api/tasks/bulk', {
      projectId,
      parentTaskId: taskId,
      tasks: suggested.map((subtask: any) => ({
        title: subtask.title,
        description: subtask.description,
        priority: subtask.priority,
        type: subtask.type,
      })),
    });
    expect(accept.status).toBe(201);
    expect(accept.json.tasks).toHaveLength(suggested.length);
    expect(accept.json.skipped).toHaveLength(0);

    const second = await client.post(`/api/ai/tasks/${taskId}/breakdown`, {});
    expect(second.status).toBe(200);
    expect(second.json.data.subtasks).toEqual([]);

    const children = await client.get(`/api/tasks?projectId=${projectId}`);
    const childTitles = children.json.tasks.map((task: any) => task.title);
    for (const subtask of suggested) {
      expect(childTitles).toContain(subtask.title);
    }
  });

  it('returns a plan with at least one section', async () => {
    const response = await client.post(`/api/ai/tasks/${taskId}/plan`, {});
    expect(response.status).toBe(200);
    expect(response.json.source).toBe('mock');
    expect(response.json.data.sections.length).toBeGreaterThanOrEqual(1);
    for (const section of response.json.data.sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.items.length).toBeGreaterThan(0);
    }
  });

  it('returns acceptance criteria', async () => {
    const response = await client.post(`/api/ai/tasks/${taskId}/acceptance-criteria`, {});
    expect(response.status).toBe(200);
    expect(response.json.data.criteria.length).toBeGreaterThanOrEqual(1);
    expect(response.json.data.criteria.every((c: string) => c.length > 0)).toBe(true);
  });

  it('returns a structured estimate', async () => {
    const response = await client.post(`/api/ai/tasks/${taskId}/estimate`, {});
    expect(response.status).toBe(200);
    expect(['XS', 'S', 'M', 'L', 'XL']).toContain(response.json.data.complexity);
    expect(response.json.data.estimatedEffort.length).toBeGreaterThan(0);
    expect(response.json.data.reasoning.length).toBeGreaterThan(0);
  });

  it('returns review findings', async () => {
    const response = await client.post(`/api/ai/tasks/${taskId}/review`, {});
    expect(response.status).toBe(200);
    expect(Array.isArray(response.json.data.findings)).toBe(true);
    for (const finding of response.json.data.findings) {
      expect(['security', 'architecture', 'edge-case', 'testing', 'performance']).toContain(
        finding.category,
      );
      expect(['info', 'warning', 'critical']).toContain(finding.severity);
    }
  });

  it('returns 404 for an unknown task id', async () => {
    const response = await client.post('/api/ai/tasks/no-such-task/breakdown', {});
    expect(response.status).toBe(404);
    expect(response.json.error).toBe('Task not found');
  });
});
