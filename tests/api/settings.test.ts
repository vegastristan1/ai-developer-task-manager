import { describe, expect, it } from 'vitest';
import { ApiClient, ensureUser, PASSWORD, uniqueName } from '../helpers/api';
import { prisma } from '@/lib/db/prisma';

function uniqueEmail(prefix: string): string {
  return `${uniqueName(prefix).replace(/\s+/g, '-')}-pw@example.com`;
}

describe('password change API', () => {
  it('rejects unauthenticated password changes', async () => {
    const anon = new ApiClient();
    const response = await anon.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: 'brand-new-password-1',
      confirmPassword: 'brand-new-password-1',
    });
    expect(response.status).toBe(401);
  });

  it('rejects a wrong current password without changing anything', async () => {
    const email = uniqueEmail('vitest-pw-wrong');
    await ensureUser(email, 'Pw Wrong');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: 'not-the-current-password',
      newPassword: 'brand-new-password-2',
      confirmPassword: 'brand-new-password-2',
    });
    expect(response.status).toBe(401);

    // Old password still works.
    const retry = new ApiClient();
    await retry.login(email);
    expect((await retry.get('/api/auth/me')).status).toBe(200);
  });

  it('rejects mismatched confirmation', async () => {
    const email = uniqueEmail('vitest-pw-mismatch');
    await ensureUser(email, 'Pw Mismatch');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: 'brand-new-password-3',
      confirmPassword: 'something-else-123',
    });
    expect(response.status).toBe(422);
    expect(JSON.stringify(response.json.issues)).toContain('confirmPassword');
  });

  it('rejects a short new password', async () => {
    const email = uniqueEmail('vitest-pw-short');
    await ensureUser(email, 'Pw Short');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(response.status).toBe(422);
  });

  it('rejects a new password identical to the current one', async () => {
    const email = uniqueEmail('vitest-pw-same');
    await ensureUser(email, 'Pw Same');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: PASSWORD,
      confirmPassword: PASSWORD,
    });
    expect(response.status).toBe(422);
  });

  it('changes the password and the new one works', async () => {
    const email = uniqueEmail('vitest-pw-ok');
    const next = `changed-password-${Date.now()}`;
    await ensureUser(email, 'Pw Ok');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: next,
      confirmPassword: next,
    });
    expect(response.status).toBe(200);

    const stale = new ApiClient();
    await stale.login(email, PASSWORD);
    expect((await stale.get('/api/auth/me')).status).toBe(401);

    const fresh = new ApiClient();
    await fresh.login(email, next);
    const me = await fresh.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.json.user.email).toBe(email);
  });
});

describe('profile avatar API', () => {
  it('rejects unauthenticated profile updates', async () => {
    const anon = new ApiClient();
    expect((await anon.patch('/api/auth/me', { name: 'X' })).status).toBe(401);
  });

  it('saves a valid avatar URL and returns it', async () => {
    const email = uniqueEmail('vitest-avatar');
    await ensureUser(email, 'Avatar Test');
    const client = new ApiClient();
    await client.login(email);
    const image = 'https://example.com/avatar.png';
    const response = await client.patch('/api/auth/me', { name: 'Avatar Test', image });
    expect(response.status).toBe(200);
    expect(response.json.user.image).toBe(image);

    const me = await client.get('/api/auth/me');
    expect(me.json.user.image).toBe(image);
  });

  it('rejects an invalid avatar URL', async () => {
    const email = uniqueEmail('vitest-avatar-bad');
    await ensureUser(email, 'Avatar Bad');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/me', {
      name: 'Avatar Bad',
      image: 'not-a-url',
    });
    expect(response.status).toBe(422);
    expect(JSON.stringify(response.json.issues)).toContain('image');
  });

  it('clears the avatar with an empty string', async () => {
    const email = uniqueEmail('vitest-avatar-clear');
    await ensureUser(email, 'Avatar Clear');
    const client = new ApiClient();
    await client.login(email);
    await client.patch('/api/auth/me', {
      name: 'Avatar Clear',
      image: 'https://example.com/avatar.png',
    });
    const cleared = await client.patch('/api/auth/me', { name: 'Avatar Clear', image: '' });
    expect(cleared.status).toBe(200);
    expect(cleared.json.user.image).toBeNull();
  });
});

describe('data export API', () => {
  it('rejects unauthenticated export requests', async () => {
    const anon = new ApiClient();
    expect((await anon.get('/api/auth/export')).status).toBe(401);
  });

  it('exports the signed-in user data without secrets', async () => {
    const email = uniqueEmail('vitest-export');
    await ensureUser(email, 'Export Test');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.get('/api/auth/export');
    expect(response.status).toBe(200);
    expect(response.json.user.email).toBe(email);
    expect(response.json.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(response.json)).not.toContain('passwordHash');
    expect(Array.isArray(response.json.user.projects)).toBe(true);
    expect(typeof response.json.exportedAt).toBe('string');
  });
});

describe('data import API', () => {
  it('rejects unauthenticated import requests', async () => {
    const anon = new ApiClient();
    expect((await anon.post('/api/auth/import', { data: {} })).status).toBe(401);
  });

  it('rejects files that are not workspace exports', async () => {
    const email = uniqueEmail('vitest-import-bad');
    await ensureUser(email, 'Import Bad');
    const client = new ApiClient();
    await client.login(email);
    expect((await client.post('/api/auth/import', { data: { foo: 1 } })).status).toBe(422);
    expect((await client.post('/api/auth/import', { data: null })).status).toBe(422);
  });

  it('restores an export into another account with remapped relations', async () => {
    const sourceEmail = uniqueEmail('vitest-import-src');
    await ensureUser(sourceEmail, 'Import Source');
    const source = await prisma.user.findUnique({
      where: { email: sourceEmail },
      select: { id: true },
    });

    const project = await prisma.project.create({
      data: { name: 'Import Fixture', description: 'roundtrip', userId: source!.id },
    });
    const label = await prisma.label.create({
      data: { name: 'fixture', color: '#ffffff', projectId: project.id },
    });
    const sprint = await prisma.sprint.create({
      data: {
        name: 'Fixture Sprint',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        projectId: project.id,
      },
    });
    const parent = await prisma.task.create({
      data: { title: 'Parent task', projectId: project.id, sprintId: sprint.id, position: 0 },
    });
    const child = await prisma.task.create({
      data: {
        title: 'Child task',
        projectId: project.id,
        parentTaskId: parent.id,
        position: 1,
        acceptanceCriteria: [{ text: 'done', done: false }],
      },
    });
    await prisma.taskLabel.create({ data: { taskId: child.id, labelId: label.id } });
    await prisma.taskDependency.create({ data: { taskId: child.id, dependsOnId: parent.id } });
    const conversation = await prisma.aIConversation.create({
      data: {
        title: 'Fixture chat',
        userId: source!.id,
        projectId: project.id,
        messages: { create: [{ role: 'USER', content: 'hello' }] },
      },
    });

    const sourceClient = new ApiClient();
    await sourceClient.login(sourceEmail);
    const exported = await sourceClient.get('/api/auth/export');
    expect(exported.status).toBe(200);

    const targetEmail = uniqueEmail('vitest-import-dst');
    await ensureUser(targetEmail, 'Import Target');
    const target = new ApiClient();
    await target.login(targetEmail);
    const imported = await target.post('/api/auth/import', { data: exported.json });
    expect(imported.status).toBe(200);
    expect(imported.json.imported).toMatchObject({
      projects: 1,
      tasks: 2,
      conversations: 1,
      messages: 1,
    });

    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true },
    });
    const tasks = await prisma.task.findMany({
      where: { project: { userId: targetUser!.id } },
      select: { id: true, title: true, parentTaskId: true, sprintId: true },
    });
    expect(tasks).toHaveLength(2);
    const restoredChild = tasks.find((task) => task.title === 'Child task');
    const restoredParent = tasks.find((task) => task.title === 'Parent task');
    expect(restoredChild?.parentTaskId).toBe(restoredParent?.id);
    expect(restoredChild?.sprintId).toBeNull();
    expect(restoredParent?.sprintId).not.toBe(sprint.id);

    const deps = await prisma.taskDependency.findMany({
      where: { taskId: restoredChild!.id },
      select: { dependsOnId: true },
    });
    expect(deps.map((dep) => dep.dependsOnId)).toEqual([restoredParent!.id]);

    const chats = await prisma.aIConversation.findMany({
      where: { userId: targetUser!.id },
      select: { projectId: true, messages: { select: { content: true } } },
    });
    expect(chats).toHaveLength(1);
    expect(chats[0]?.messages.map((message) => message.content)).toEqual(['hello']);
    const restoredProjects = await prisma.project.findMany({
      where: { userId: targetUser!.id },
      select: { id: true },
    });
    expect(restoredProjects).toHaveLength(1);
    expect(chats[0]?.projectId).toBe(restoredProjects[0]?.id);

    await prisma.aIConversation.deleteMany({ where: { id: conversation.id } });
    await prisma.project.deleteMany({ where: { id: project.id } });
  });
});
