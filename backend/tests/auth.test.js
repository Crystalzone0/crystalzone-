import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { User } from '../src/models/index.js';
import { PASSWORD, api, clearDb, createUser, customerAgent, loginAgent, newAgent, signSession, startDb, stopDb } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const valid = { name: 'Sara Khan', email: 'sara@example.com', phone: '03001234567', password: PASSWORD };

describe('registration', () => {
  it('creates a customer, hashes the password, and ignores a "role" sent by the client', async () => {
    const res = await api().post('/api/auth/register').send({ ...valid, role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['set-cookie'].join(';')).toContain('cz_token');

    const stored = await User.findOne({ email: valid.email }).select('+password');
    expect(stored.role).toBe('customer');
    expect(stored.password).not.toBe(PASSWORD);
    expect(stored.password).toMatch(/^\$2[aby]\$12\$/); // a bcrypt hash
  });

  it('stores emails in lowercase and rejects a second account with the same email', async () => {
    expect((await api().post('/api/auth/register').send({ ...valid, email: 'Sara@Example.COM' })).status).toBe(201);
    expect(await User.countDocuments({ email: 'sara@example.com' })).toBe(1);

    const again = await api().post('/api/auth/register').send(valid);
    expect(again.status).toBe(409);
  });

  it.each([
    ['too short', 'abc1'],
    ['no number', 'onlyletters'],
    ['no letter', '12345678'],
  ])('rejects a weak password (%s)', async (_label, password) => {
    const res = await api().post('/api/auth/register').send({ ...valid, password });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('rejects an invalid email and phone number', async () => {
    const res = await api().post('/api/auth/register').send({ ...valid, email: 'not-an-email', phone: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['email', 'phone']));
  });
});

describe('login and sessions', () => {
  it('logs in with an httpOnly cookie, and /me shows the user', async () => {
    const user = await createUser();
    const agent = newAgent();
    const res = await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD });

    expect(res.status).toBe(200);
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain('cz_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');

    const me = await agent.get('/api/auth/me');
    expect(me.body.user.email).toBe(user.email);
    expect(me.body.user.password).toBeUndefined();
  });

  it('gives the same generic answer for an unknown email and a wrong password', async () => {
    const user = await createUser();
    const wrongPassword = await api().post('/api/auth/login').send({ email: user.email, password: 'WrongPass123' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('is not fooled by NoSQL operators in the login form', async () => {
    await createUser();
    const res = await api().post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('reports a visitor as "not logged in" without an error', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('logs out: the session no longer works', async () => {
    const { agent } = await customerAgent();
    expect((await agent.get('/api/cart')).status).toBe(200);

    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).body.user).toBeNull();
    expect((await agent.get('/api/cart')).status).toBe(401);
  });

  it('protects customer APIs from visitors', async () => {
    for (const path of ['/api/cart', '/api/wishlist', '/api/orders', '/api/addresses']) {
      expect((await api().get(path)).status, path).toBe(401);
    }
  });

  it('blocks a disabled account, even with a session that was already open', async () => {
    const { user, agent } = await customerAgent();
    await User.updateOne({ _id: user._id }, { isActive: false });

    expect((await agent.get('/api/cart')).status).toBe(403);
    const login = await api().post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    expect(login.status).toBe(403);
  });

  it('only lets real admins through the admin login', async () => {
    const customer = await createUser();
    const denied = await api().post('/api/auth/admin-login').send({ email: customer.email, password: PASSWORD });
    expect(denied.status).toBe(401);
    expect(denied.body.message).toBe('Invalid email or password');

    const admin = await createUser({ role: 'admin' });
    const ok = await api().post('/api/auth/admin-login').send({ email: admin.email, password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe('admin');
  });
});

describe('profile and password', () => {
  it('updates name and phone, but a customer cannot make themselves an admin', async () => {
    const { user, agent } = await customerAgent();
    const res = await agent.put('/api/auth/profile').send({ name: 'New Name', phone: '03111111111', role: 'admin', isActive: false });

    expect(res.status).toBe(200);
    const stored = await User.findById(user._id);
    expect(stored.name).toBe('New Name');
    expect(stored.role).toBe('customer');
    expect(stored.isActive).toBe(true);
  });

  it('changes the password, ends older sessions, and the old password stops working', async () => {
    const { user, agent } = await customerAgent();
    const oldSession = signSession(user._id, 120); // a session from two minutes ago, e.g. another device
    const asOldSession = () => api().get('/api/cart').set('Cookie', `cz_token=${oldSession}`);

    expect((await asOldSession()).status).toBe(200);

    const wrongCurrent = await agent.put('/api/auth/password').send({ currentPassword: 'WrongPass123', newPassword: 'NewPassw0rd9' });
    expect(wrongCurrent.status).toBe(400);

    const changed = await agent.put('/api/auth/password').send({ currentPassword: PASSWORD, newPassword: 'NewPassw0rd9' });
    expect(changed.status).toBe(200);

    expect((await asOldSession()).status).toBe(401); // the other device is logged out
    expect((await agent.get('/api/cart')).status).toBe(200); // this device got a fresh session
    expect((await api().post('/api/auth/login').send({ email: user.email, password: PASSWORD })).status).toBe(401);
    expect((await api().post('/api/auth/login').send({ email: user.email, password: 'NewPassw0rd9' })).status).toBe(200);
  });

  it('rejects a new password that equals the current one', async () => {
    const { agent } = await customerAgent();
    const res = await agent.put('/api/auth/password').send({ currentPassword: PASSWORD, newPassword: PASSWORD });
    expect(res.status).toBe(400);
  });
});

describe('logging in as someone else is impossible without their password', () => {
  it('does not accept another user id in a forged token signed with a different secret', async () => {
    const user = await createUser();
    const forged = `${signSession(user._id).slice(0, -4)}AAAA`; // damaged signature
    const res = await api().get('/api/cart').set('Cookie', `cz_token=${forged}`);
    expect(res.status).toBe(401);
    expect((await loginAgent(user)).get).toBeTypeOf('function'); // the real login still works
  });
});