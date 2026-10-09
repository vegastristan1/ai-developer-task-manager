import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiClient, loginClient } from '../helpers/api';

describe('authorization boundaries', () => {
  let alice: ApiClient;
  let bob: ApiClient;
  const token = `authz${Date.now()}`;
  let projectId: string;
  let taskId: string;
  let secondTaskId: string;
  let sprintId: string;
  let labelId: string;
  let dependencyId: string;
  let conversationId: string;

  beforeAll(async () => {
    alice = await loginClient();
    bob = await loginClient('vitest-other@example.com');

    const project = await alice.post('/api/projects', {
      name: `Authz ${token}`,
      description: 'Cross-user fixture project',
    });
    expect(project.status).toBe(201);
    projectId = project.json.project.id;

    const task = await alice.post('/api/tasks', { title: `${token} primary`, projectId });
    expect(task.status).toBe(201);
    taskId = task.json.task.id;

    const second = await alice.post('/api/tasks', { title: `${token} secondary`, projectId });
    expect(second.status).toBe(201);
    secondTaskId = second.json.task.id;

    const sprint = await alice.post('/api/sprints', {
      name: `Authz sprint ${token}`,
      projectId,
      startDate: '2026-01-05',
      endDate: '2026-01-19',
    });
    expect(sprint.status).toBe(201);
    sprintId = sprint.json.sprint.id;

    const label = await alice.post('/api/labels', {
      name: `authz-${token}`,
      projectId,
      color: '#3b82f6',
    });
    expect(label.status).toBe(201);
    labelId = label.json.label.id;

    const dependency = await alice.post(`/api/tasks/${taskId}/dependencies`, {
      dependsOnId: secondTaskId,
    });
    expect(dependency.status).toBe(201);
    dependencyId = dependency.json.dependency.id;

    const chat = await alice.post('/api/ai/chat', { content: `authz chat ${token}` });
    expect(chat.status).toBe(200);
    conversationId = chat.headers.get('x-conversation-id') ?? '';
    expect(conversationId).toBeTruthy();
  });

  afterAll(async () => {
    await alice.delete(`/api/ai/conversations/${conversationId}`);
    await alice.delete(`/api/projects/${projectId}`);
  });

  it("returns 404 when touching another user's resources", async () => {
    const cases: Array<[string, string, unknown | undefined]> = [
      ['GET', `/api/projects/${projectId}`, undefined],
      ['PUT', `/api/projects/${projectId}`, { name: 'stolen' }],
      ['DELETE', `/api/projects/${projectId}`, undefined],
      ['GET', `/api/tasks/${taskId}`, undefined],
      ['PUT', `/api/tasks/${taskId}`, { status: 'DONE' }],
      ['DELETE', `/api/tasks/${taskId}`, undefined],
      ['GET', `/api/sprints/${sprintId}`, undefined],
      ['PUT', `/api/sprints/${sprintId}`, { name: 'stolen' }],
      ['DELETE', `/api/sprints/${sprintId}`, undefined],
      ['PUT', `/api/labels/${labelId}`, { name: 'stolen' }],
      ['DELETE', `/api/labels/${labelId}`, undefined],
      ['GET', `/api/ai/conversations/${conversationId}`, undefined],
      ['DELETE', `/api/ai/conversations/${conversationId}`, undefined],
      ['POST', `/api/tasks/${taskId}/dependencies`, { dependsOnId: secondTaskId }],
      ['DELETE', `/api/tasks/${taskId}/dependencies/${dependencyId}`, undefined],
    ];

    for (const [method, path, body] of cases) {
      const response = await bob.request(method, path, body);
      expect(response.status, `${method} ${path}`).toBe(404);
    }
  });

  it('scopes listing endpoints to the owner', async () => {
    const tasks = await bob.get(`/api/tasks?projectId=${projectId}`);
    if (tasks.status === 200) {
      expect(tasks.json.tasks).toHaveLength(0);
    } else {
      expect(tasks.status).toBe(404);
    }

    const labels = await bob.get(`/api/labels?projectId=${projectId}`);
    if (labels.status === 200) {
      expect(labels.json.labels).toHaveLength(0);
    } else {
      expect(labels.status).toBe(404);
    }
  });

  it('scopes AI tool calls to the owning user', async () => {
    expect((await bob.post(`/api/ai/tasks/${taskId}/breakdown`, {})).status).toBe(404);
    expect((await bob.post(`/api/ai/tasks/${taskId}/plan`, {})).status).toBe(404);
  });

  it('returns 401 for every protected API route when unauthenticated', async () => {
    const anon = new ApiClient();
    const routes: Array<[string, string, unknown | undefined]> = [
      ['GET', '/api/auth/me', undefined],
      ['PATCH', '/api/auth/me', { name: 'Nobody' }],
      ['GET', '/api/projects', undefined],
      ['POST', '/api/projects', { name: 'Nope' }],
      ['GET', '/api/tasks', undefined],
      ['POST', '/api/tasks', { title: 'Nope' }],
      ['POST', '/api/tasks/bulk', { tasks: [] }],
      ['GET', '/api/tasks/some-id', undefined],
      ['PUT', '/api/tasks/some-id', { status: 'DONE' }],
      ['DELETE', '/api/tasks/some-id', undefined],
      ['GET', '/api/sprints', undefined],
      ['POST', '/api/sprints', { name: 'Nope' }],
      ['GET', '/api/sprints/some-id', undefined],
      ['GET', '/api/labels?projectId=some-id', undefined],
      ['POST', '/api/labels', { name: 'nope', projectId: 'some-id' }],
      ['PUT', '/api/labels/some-id', { name: 'nope' }],
      ['DELETE', '/api/labels/some-id', undefined],
      ['GET', '/api/search?q=anything', undefined],
      ['GET', '/api/dashboard/stats', undefined],
      ['GET', '/api/ai/conversations', undefined],
      ['GET', '/api/ai/conversations/some-id', undefined],
      ['DELETE', '/api/ai/conversations/some-id', undefined],
      ['POST', '/api/ai/chat', { content: 'hello' }],
      ['POST', '/api/ai/tasks/some-id/breakdown', {}],
      ['POST', '/api/ai/tasks/some-id/plan', {}],
      ['POST', '/api/ai/tasks/some-id/estimate', {}],
      ['POST', '/api/ai/tasks/some-id/acceptance-criteria', {}],
      ['POST', '/api/ai/tasks/some-id/review', {}],
      ['POST', '/api/tasks/some-id/dependencies', { dependsOnId: 'other-id' }],
    ];

    for (const [method, path, body] of routes) {
      const response = await anon.request(method, path, body);
      expect(response.status, `${method} ${path}`).toBe(401);
    }
  });

  it('keeps dashboard and search data isolated per user', async () => {
    const marker = `isolation${Date.now()}`;
    const project = await alice.post('/api/projects', { name: `${marker} project` });
    expect(project.status).toBe(201);
    const isolatedTask = await alice.post('/api/tasks', {
      title: `${marker} task`,
      projectId: project.json.project.id,
    });
    expect(isolatedTask.status).toBe(201);

    const bobSearch = await bob.get(`/api/search?q=${marker}`);
    expect(bobSearch.status).toBe(200);
    expect(bobSearch.json.results.tasks).toHaveLength(0);
    expect(bobSearch.json.results.projects).toHaveLength(0);

    const aliceSearch = await alice.get(`/api/search?q=${marker}`);
    expect(aliceSearch.status).toBe(200);
    expect(aliceSearch.json.results.tasks.length).toBeGreaterThanOrEqual(1);

    const bobDashboard = await bob.get('/api/dashboard/stats');
    expect(bobDashboard.status).toBe(200);
    const bobNames = bobDashboard.json.stats.projectBreakdown.map(
      (entry: { name: string }) => entry.name,
    );
    expect(bobNames).not.toContain(`${marker} project`);

    const aliceDashboard = await alice.get('/api/dashboard/stats');
    expect(aliceDashboard.status).toBe(200);
    const aliceNames = aliceDashboard.json.stats.projectBreakdown.map(
      (entry: { name: string }) => entry.name,
    );
    expect(aliceNames).toContain(`${marker} project`);

    await alice.delete(`/api/projects/${project.json.project.id}`);
  });

  it('only updates the session user profile', async () => {
    const bobBefore = await bob.get('/api/auth/me');
    expect(bobBefore.status).toBe(200);
    const bobNameBefore = bobBefore.json.user.name;
    const bobId = bobBefore.json.user.id;

    const aliceBefore = await alice.get('/api/auth/me');
    const aliceId = aliceBefore.json.user.id;
    const aliceNameBefore = aliceBefore.json.user.name;

    const renamed = `Authz Alice ${Date.now()}`;
    const patched = await alice.patch('/api/auth/me', { name: renamed });
    expect(patched.status).toBe(200);
    expect(patched.json.user.name).toBe(renamed);
    expect(patched.json.user.id).toBe(aliceId);

    const aliceAfter = await alice.get('/api/auth/me');
    expect(aliceAfter.json.user.name).toBe(renamed);

    const bobAfter = await bob.get('/api/auth/me');
    expect(bobAfter.json.user.name).toBe(bobNameBefore);
    expect(bobAfter.json.user.id).toBe(bobId);

    const restore = await alice.patch('/api/auth/me', { name: aliceNameBefore });
    expect(restore.status).toBe(200);
  });
});
