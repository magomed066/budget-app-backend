const assert = require('node:assert/strict')
const { test } = require('node:test')

// Keep these tests independent of local credentials and PostgreSQL.
Object.assign(process.env, {
  DB_NAME: 'test', DB_USER_NAME: 'test', DB_PASSWORD: 'test',
  DB_HOST: 'localhost', DB_PORT: '5432',
  JWT_ACCESS_TOKEN: 'accounts-test-access-secret',
  JWT_REFRESH_TOKEN: 'accounts-test-refresh-secret',
  JWT_ACCESS_EXPIRES_IN: '15m', JWT_REFRESH_EXPIRES_IN: '7d'
})
require('reflect-metadata')
const Fastify = require('fastify')
const { Account } = require('../dist/modules/account/account.schema')
const { AuthSession } = require('../dist/modules/user/logout-user/logout-user.schema')
const { createAccountRoute } = require('../dist/modules/account/create-account/create-account.route')
const { getAccountsRoute } = require('../dist/modules/account/get-accounts/get-accounts.route')
const { updateAccountRoute } = require('../dist/modules/account/update-account/update-account.route')
const { getAccountRoute } = require('../dist/modules/account/get-account/get-account.route')
const { errorHandlerPlugin } = require('../dist/plugins/error-handler')
const { tokensService } = require('../dist/plugins/tokens')

async function fixture(t) {
  const rows = []
  const sessions = new Map()
  const repository = {
    update: async (where, changes) => {
      let affected = 0
      for (const row of rows) {
        if (Object.entries(where).every(([key, value]) => row[key] === value)) {
          Object.assign(row, changes, { updatedAt: new Date() })
          affected++
        }
      }
      return { affected }
    },
    findOneBy: async (where) => rows.find((row) =>
      Object.entries(where).every(([key, value]) => row[key] === value)
    ) ?? null,
    create: (input) => ({ ...input }),
    save: async (input) => {
      const row = { ...input, id: rows.length + 1, createdAt: new Date(), updatedAt: new Date() }
      rows.push(row)
      return row
    },
    find: async ({ where, order }) => {
      assert.deepEqual(order, { createdAt: 'DESC', id: 'DESC' })
      return rows.filter((row) => row.userId === where.userId).slice().reverse()
    }
  }
  const app = Fastify()
  app.decorate('db', {
    getRepository(entity) {
      if (entity === Account) return repository
      assert.equal(entity, AuthSession)
      return { existsBy: async ({ id, userId }) => sessions.get(id) === userId }
    }
  })
  await app.register(errorHandlerPlugin)
  await app.register(createAccountRoute, { prefix: '/api' })
  await app.register(getAccountsRoute, { prefix: '/api' })
  await app.register(getAccountRoute, { prefix: '/api' })
  await app.register(updateAccountRoute, { prefix: '/api' })
  t.after(() => app.close())
  const login = (userId) => {
    const tokens = tokensService.generatePayload({ _id: userId })
    sessions.set(tokens.sessionId, userId)
    return { authorization: `Bearer ${tokens.accessToken}` }
  }
  return { app, rows, sessions, login }
}

const payload = { name: '  Cash  ', type: 'cash', currency: 'RUB', openingBalanceMinor: 100000 }

test('creation uses authenticated owner; listing isolates users and serializes public fields', async (t) => {
  const { app, rows, login } = await fixture(t)
  const alice = login(1)
  const bob = login(2)
  const empty = await app.inject({ method: 'GET', url: '/api/accounts', headers: bob })
  assert.equal(empty.statusCode, 200)
  assert.deepEqual(empty.json(), { success: true, data: [] })
  const created = await app.inject({ method: 'POST', url: '/api/accounts', headers: alice, payload: { ...payload, userId: 2 } })
  assert.equal(created.statusCode, 201)
  assert.equal(rows[0].userId, 1)
  assert.equal(created.json().data.name, 'Cash')
  assert.equal(created.json().data.openingBalanceMinor, 100000)
  assert.equal(created.json().data.userId, undefined)
  assert.ok(!Number.isNaN(Date.parse(created.json().data.createdAt)))
  await app.inject({ method: 'POST', url: '/api/accounts', headers: bob, payload: { ...payload, name: 'Bob bank', type: 'bank', openingBalanceMinor: -100 } })
  const listed = await app.inject({ method: 'GET', url: '/api/accounts', headers: alice })
  assert.equal(listed.statusCode, 200)
  assert.deepEqual(listed.json().data.map((row) => row.name), ['Cash'])
  const bobs = await app.inject({ method: 'GET', url: '/api/accounts', headers: bob })
  assert.deepEqual(bobs.json().data.map((row) => row.name), ['Bob bank'])
})

test('invalid account inputs fail without saving', async (t) => {
  const { app, rows, login } = await fixture(t)
  const headers = login(1)
  for (const patch of [
    { name: '   ' }, { name: '' }, { name: 'a'.repeat(101) },
    { type: 'credit' }, { currency: 'USD' },
    { openingBalanceMinor: 1.5 }, { openingBalanceMinor: 2147483648 },
    { openingBalanceMinor: -2147483649 }
  ]) {
    const response = await app.inject({ method: 'POST', url: '/api/accounts', headers, payload: { ...payload, ...patch } })
    assert.equal(response.statusCode, 400, JSON.stringify(patch))
  }
  const missing = await app.inject({ method: 'POST', url: '/api/accounts', headers, payload: {} })
  assert.equal(missing.statusCode, 400)
  assert.equal(rows.length, 0)
})

test('all account endpoints reject missing, invalid and revoked authentication', async (t) => {
  const { app, rows, sessions, login } = await fixture(t)
  const revoked = login(1)
  sessions.clear()
  for (const [method, url] of [['GET', '/api/accounts'], ['POST', '/api/accounts'], ['GET', '/api/accounts/1'], ['PATCH', '/api/accounts/1']]) {
    for (const headers of [{}, { authorization: 'Bearer invalid' }, revoked]) {
      const response = await app.inject({ method, url, headers, ...(method !== 'GET' ? { payload } : {}) })
      assert.equal(response.statusCode, 401)
    }
  }
  assert.equal(rows.length, 0)
})

test('integer boundaries and zero are accepted exactly', async (t) => {
  const { app, login } = await fixture(t)
  const headers = login(1)
  for (const amount of [-2147483648, 0, 2147483647]) {
    const response = await app.inject({ method: 'POST', url: '/api/accounts', headers, payload: { ...payload, openingBalanceMinor: amount } })
    assert.equal(response.statusCode, 201)
    assert.equal(response.json().data.openingBalanceMinor, amount)
  }
})

test('get one account returns the requested account only to its owner', async (t) => {
  const { app, login } = await fixture(t)
  const alice = login(1)
  const bob = login(2)
  const first = await app.inject({ method: 'POST', url: '/api/accounts', headers: alice, payload })
  const second = await app.inject({ method: 'POST', url: '/api/accounts', headers: alice, payload: { ...payload, name: 'Bank', type: 'bank' } })
  const id = second.json().data.id
  assert.notEqual(first.json().data.id, id)

  const response = await app.inject({ method: 'GET', url: `/api/accounts/${id}`, headers: alice })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), second.json())
  assert.equal(response.json().data.userId, undefined)

  const forbidden = await app.inject({ method: 'GET', url: `/api/accounts/${id}`, headers: bob })
  const missing = await app.inject({ method: 'GET', url: '/api/accounts/2147483647', headers: alice })
  assert.equal(forbidden.statusCode, 404)
  assert.equal(missing.statusCode, 404)
  assert.deepEqual(forbidden.json(), missing.json())
  assert.deepEqual(missing.json(), {
    success: false,
    statusCode: 404,
    errors: ['Account was not found']
  })
})

test('get one account rejects invalid IDs before accessing the database', async (t) => {
  const { app, login } = await fixture(t)
  const headers = login(1)
  app.db.getRepository(Account).findOneBy = async () => {
    assert.fail('Invalid IDs must not reach the repository')
  }
  for (const id of ['0', '-1', '1.5', 'abc', '2147483648', '9007199254740993']) {
    const response = await app.inject({ method: 'GET', url: `/api/accounts/${id}`, headers })
    assert.equal(response.statusCode, 400, id)
    assert.equal(response.json().success, false)
  }
})

test('patch updates supplied fields, preserves other accounts and ignores protected fields', async (t) => {
  const { app, rows, login } = await fixture(t)
  const headers = login(1)
  const created = await app.inject({ method: 'POST', url: '/api/accounts', headers, payload })
  await app.inject({ method: 'POST', url: '/api/accounts', headers, payload: { ...payload, name: 'Savings' } })
  const original = created.json().data
  const other = { ...rows[1] }
  const url = `/api/accounts/${original.id}`
  const renamed = await app.inject({ method: 'PATCH', url, headers, payload: { name: '  Wallet  ', userId: 2, id: 999, currency: 'USD', createdAt: '2000-01-01' } })
  assert.equal(renamed.statusCode, 200)
  assert.equal(renamed.json().data.name, 'Wallet')
  assert.equal(renamed.json().data.openingBalanceMinor, original.openingBalanceMinor)
  assert.equal(renamed.json().data.type, original.type)
  assert.equal(renamed.json().data.createdAt, original.createdAt)
  assert.equal(renamed.json().data.currency, 'RUB')
  assert.equal(renamed.json().data.id, original.id)
  assert.equal(renamed.json().data.userId, undefined)
  assert.equal(rows[0].userId, 1)
  for (const amount of [0, -100, -2147483648, 2147483647]) {
    const changed = await app.inject({ method: 'PATCH', url, headers, payload: { type: 'bank', openingBalanceMinor: amount } })
    assert.equal(changed.statusCode, 200)
    assert.equal(changed.json().data.openingBalanceMinor, amount)
    assert.equal(changed.json().data.type, 'bank')
    assert.equal(changed.json().data.name, 'Wallet')
  }
  const fetched = await app.inject({ method: 'GET', url, headers })
  assert.equal(fetched.json().data.openingBalanceMinor, 2147483647)
  assert.deepEqual(rows[1], other)
})

test('patch returns identical 404 for missing and other users accounts without mutation', async (t) => {
  const { app, rows, login } = await fixture(t)
  const alice = login(1)
  const bob = login(2)
  await app.inject({ method: 'POST', url: '/api/accounts', headers: alice, payload })
  const before = JSON.stringify(rows)
  const denied = await app.inject({ method: 'PATCH', url: '/api/accounts/1', headers: bob, payload: { openingBalanceMinor: 0 } })
  const missing = await app.inject({ method: 'PATCH', url: '/api/accounts/999', headers: alice, payload: { name: 'Missing' } })
  assert.equal(denied.statusCode, 404)
  assert.equal(missing.statusCode, 404)
  assert.deepEqual(denied.json(), missing.json())
  assert.equal(JSON.stringify(rows), before)
})

test('patch rejects invalid IDs and bodies before updating', async (t) => {
  const { app, login } = await fixture(t)
  const headers = login(1)
  app.db.getRepository(Account).update = async () => {
    assert.fail('Invalid input must not reach update')
  }
  for (const body of [
    {}, { userId: 2 }, { currency: 'RUB' }, { name: '' }, { name: '   ' },
    { name: null }, { name: 'a'.repeat(101) }, { type: 'credit' }, { type: null },
    { openingBalanceMinor: null }, { openingBalanceMinor: 0.5 },
    { openingBalanceMinor: 2147483648 }, { openingBalanceMinor: -2147483649 }
  ]) {
    const response = await app.inject({ method: 'PATCH', url: '/api/accounts/1', headers, payload: body })
    assert.equal(response.statusCode, 400, JSON.stringify(body))
  }
  for (const id of ['0', '-1', '1.5', 'abc', '2147483648']) {
    const response = await app.inject({ method: 'PATCH', url: `/api/accounts/${id}`, headers, payload: { name: 'Wallet' } })
    assert.equal(response.statusCode, 400, id)
  }
})
