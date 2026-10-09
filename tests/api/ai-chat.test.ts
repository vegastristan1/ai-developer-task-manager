import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loginClient, uniqueName, type ApiClient } from '../helpers/api';

describe('AI chat API', () => {
  let client: ApiClient;
  let projectId: string;
  let conversationId: string;

  beforeAll(async () => {
    client = await loginClient();

    const project = await client.post('/api/projects', {
      name: uniqueName('Vitest Chat'),
      description: 'Chat fixture project',
      technologyStack: ['Next.js'],
    });
    expect(project.status).toBe(201);
    projectId = project.json.project.id;
  });

  afterAll(async () => {
    if (conversationId) {
      await client.delete(`/api/ai/conversations/${conversationId}`);
    }
    await client.delete(`/api/projects/${projectId}`);
  });

  it('rejects invalid payloads', async () => {
    expect((await client.post('/api/ai/chat', {})).status).toBe(422);
    expect((await client.post('/api/ai/chat', { content: '   ' })).status).toBe(422);
    expect((await client.post('/api/ai/chat', { content: 'x'.repeat(4001) })).status).toBe(422);
  });

  it('returns 404 for an unknown bound project', async () => {
    const response = await client.post('/api/ai/chat', {
      content: 'hello',
      projectId: 'no-such-project',
    });
    expect(response.status).toBe(404);
  });

  it('streams a mock reply with source and conversation headers', async () => {
    const response = await client.post('/api/ai/chat', { content: 'Hello, assistant!' });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(response.headers.get('x-ai-source')).toBe('mock');
    expect(response.headers.get('x-conversation-id')).toBeTruthy();
    expect(response.text).toContain('[Mock reply');

    conversationId = response.headers.get('x-conversation-id') as string;
  });

  it('persists both messages on the conversation', async () => {
    const response = await client.get(`/api/ai/conversations/${conversationId}`);
    expect(response.status).toBe(200);
    const { conversation } = response.json;
    expect(conversation.id).toBe(conversationId);

    const roles = conversation.messages.map((message: any) => message.role);
    expect(roles).toEqual(['USER', 'ASSISTANT']);
    expect(conversation.messages[0].content).toBe('Hello, assistant!');
    expect(conversation.messages[1].content).toContain('[Mock reply');
  });

  it('continues the same conversation on follow-up messages', async () => {
    const response = await client.post('/api/ai/chat', {
      content: 'What projects do I have?',
      conversationId,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('x-conversation-id')).toBe(conversationId);

    const fetched = await client.get(`/api/ai/conversations/${conversationId}`);
    expect(fetched.json.conversation.messages).toHaveLength(4);
  });

  it('lists conversations with titles and counts', async () => {
    const response = await client.get('/api/ai/conversations');
    expect(response.status).toBe(200);
    const summary = response.json.conversations.find((entry: any) => entry.id === conversationId);
    expect(summary).toBeTruthy();
    expect(summary.title).toBe('Hello, assistant!');
    expect(summary.messageCount).toBe(4);
  });

  it('returns 404 for unknown conversations', async () => {
    expect((await client.get('/api/ai/conversations/nope')).status).toBe(404);
    expect((await client.delete('/api/ai/conversations/nope')).status).toBe(404);
  });

  it('returns 404 when continuing a deleted conversation', async () => {
    const deleted = await client.delete(`/api/ai/conversations/${conversationId}`);
    expect(deleted.status).toBe(200);

    const response = await client.post('/api/ai/chat', {
      content: 'hello again',
      conversationId,
    });
    expect(response.status).toBe(404);
    conversationId = '';
  });

  it('deletes a conversation', async () => {
    const created = await client.post('/api/ai/chat', { content: 'temp message' });
    expect(created.status).toBe(200);
    const id = created.headers.get('x-conversation-id') as string;

    expect((await client.delete(`/api/ai/conversations/${id}`)).status).toBe(200);
    expect((await client.get(`/api/ai/conversations/${id}`)).status).toBe(404);
    expect((await client.delete(`/api/ai/conversations/${id}`)).status).toBe(404);
  });

  it('propose a bound-project action when asked to create a task', async () => {
    const response = await client.post('/api/ai/chat', {
      content: 'Create a task to add rate limiting',
      projectId,
    });
    expect(response.status).toBe(200);
    expect(response.text).toContain('```ai-action');
    expect(response.text).toContain('"create_task"');
    expect(response.text).toContain('add rate limiting');
    expect(response.text).toContain('Vitest Chat');

    const id = response.headers.get('x-conversation-id') as string;
    await client.delete(`/api/ai/conversations/${id}`);
  });

  it('does not propose actions without a bound project', async () => {
    const response = await client.post('/api/ai/chat', {
      content: 'Create a task to add rate limiting',
    });
    expect(response.status).toBe(200);
    expect(response.text).not.toContain('```ai-action');
    expect(response.text).toContain('bind a project');

    const id = response.headers.get('x-conversation-id') as string;
    await client.delete(`/api/ai/conversations/${id}`);
  });
});
