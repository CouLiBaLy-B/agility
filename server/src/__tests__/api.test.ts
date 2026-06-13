import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

const app = createApp();

async function login() {
  const response = await request(app)
    .post('/auth/login')
    .send({ email: 'sarah.chen@company.com', password: 'demo-password' })
    .expect(200);

  expect(response.body.accessToken).toEqual(expect.any(String));
  return response.body.accessToken as string;
}

describe('Agility API', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', service: 'agility-api' });
  });

  it('authenticates and returns current user', async () => {
    const token = await login();
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.user.email).toBe('sarah.chen@company.com');
    expect(response.body.workspaces[0].id).toBe('w1');
  });

  it('lists seeded boards with tasks', async () => {
    const token = await login();
    const response = await request(app)
      .get('/workspaces/w1/boards')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(3);
    expect(response.body[0].name).toBe('Product Launch Q2');
    expect(response.body[0].tasks).toHaveLength(8);
  });

  it('updates user preferences', async () => {
    const token = await login();
    const response = await request(app)
      .patch('/users/me/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'dark', emailNotifications: false })
      .expect(200);

    expect(response.body.theme).toBe('dark');
    expect(response.body.emailNotifications).toBe(false);
  });

  it('marks notifications as read', async () => {
    const token = await login();
    const before = await request(app)
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(before.body.count).toBeGreaterThanOrEqual(1);

    await request(app)
      .patch('/notifications/read-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const after = await request(app)
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(after.body.count).toBe(0);
  });
});
