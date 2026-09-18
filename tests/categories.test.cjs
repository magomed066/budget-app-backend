const assert = require('node:assert/strict')
const { test } = require('node:test')

// Keep these tests independent of local credentials and PostgreSQL.
Object.assign(process.env, {
  DB_NAME: 'test', DB_USER_NAME: 'test', DB_PASSWORD: 'test',
  DB_HOST: 'localhost', DB_PORT: '5432',
  JWT_ACCESS_TOKEN: 'categories-test-access-secret',
  JWT_REFRESH_TOKEN: 'categories-test-refresh-secret',
  JWT_ACCESS_EXPIRES_IN: '15m', JWT_REFRESH_EXPIRES_IN: '7d'
})
require('reflect-metadata')
const Fastify = require('fastify')
const { Category } = require('../dist/modules/category/category.schema')
const { AuthSession } = require('../dist/modules/user/logout-user/logout-user.schema')
const { createCategoryRoute } = require('../dist/modules/category/create-category/create-category.route')
const { getCategoriesRoute } = require('../dist/modules/category/get-categories/get-categories.route')
const { updateCategoryRoute } = require('../dist/modules/category/update-category/update-category.route')
const { getCategoryRoute } = require('../dist/modules/category/get-category/get-category.route')
const { deleteCategoryRoute } = require('../dist/modules/category/delete-category/delete-category.route')
const { errorHandlerPlugin } = require('../dist/plugins/error-handler')
const { tokensService } = require('../dist/plugins/tokens')

async function fixture(t) {
  const rows = []
  const sessions = new Map()
  const repository = {
    delete: async (where) => {
      let affected = 0
      for (let index = rows.length - 1; index >= 0; index--) {
        if (Object.entries(where).every(([key, value]) => rows[index][key] === value)) {
          rows.splice(index, 1)
          affected++
        }
      }
      return { affected }
    },
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
      if (entity === Category) return repository
      assert.equal(entity, AuthSession)
      return { existsBy: async ({ id, userId }) => sessions.get(id) === userId }
    }
  })
  await app.register(errorHandlerPlugin)
  await app.register(createCategoryRoute, { prefix: '/api' })
  await app.register(getCategoriesRoute, { prefix: '/api' })
  await app.register(getCategoryRoute, { prefix: '/api' })
  await app.register(updateCategoryRoute, { prefix: '/api' })
  await app.register(deleteCategoryRoute, { prefix: '/api' })
  t.after(() => app.close())
  const login = (userId) => {
    const tokens = tokensService.generatePayload({ _id: userId })
    sessions.set(tokens.sessionId, userId)
    return { authorization: `Bearer ${tokens.accessToken}` }
  }
  return { app, rows, sessions, login }
}

const payload = { name: '  Food  ', type: 'expense' }

test('creation uses authenticated owner; listing isolates users and serializes public fields', async (t) => {
  const { app, rows, login } = await fixture(t)
  const alice = login(1)
  const bob = login(2)
  const empty = await app.inject({ method: 'GET', url: '/api/categories', headers: bob })
  assert.equal(empty.statusCode, 200)
  assert.deepEqual(empty.json(), { success: true, data: [] })
  const created = await app.inject({ method: 'POST', url: '/api/categories', headers: alice, payload: { ...payload, userId: 2 } })
  assert.equal(created.statusCode, 201)
  assert.equal(rows[0].userId, 1)
  assert.equal(created.json().data.name, 'Food')
  assert.equal(created.json().data.userId, undefined)
  assert.ok(!Number.isNaN(Date.parse(created.json().data.createdAt)))
  await app.inject({ method: 'POST', url: '/api/categories', headers: bob, payload: { ...payload, name: 'Bob bank', type: 'income' } })
  const listed = await app.inject({ method: 'GET', url: '/api/categories', headers: alice })
  assert.equal(listed.statusCode, 200)
  assert.deepEqual(listed.json().data.map((row) => row.name), ['Food'])
  const bobs = await app.inject({ method: 'GET', url: '/api/categories', headers: bob })
  assert.deepEqual(bobs.json().data.map((row) => row.name), ['Bob bank'])
})

test('invalid category inputs fail without saving', async (t) => {
  const { app, rows, login } = await fixture(t)
  const headers = login(1)
  for (const patch of [
    { name: '   ' }, { name: '' }, { name: 'a'.repeat(101) },
    { type: 'credit' }, { type: null }, { name: null }
  ]) {
    const response = await app.inject({ method: 'POST', url: '/api/categories', headers, payload: { ...payload, ...patch } })
    assert.equal(response.statusCode, 400, JSON.stringify(patch))
  }
  const missing = await app.inject({ method: 'POST', url: '/api/categories', headers, payload: {} })
  assert.equal(missing.statusCode, 400)
  assert.equal(rows.length, 0)
})

test('all category endpoints reject missing, invalid and revoked authentication', async (t) => {
  const { app, rows, sessions, login } = await fixture(t)
  const revoked = login(1)
  sessions.clear()
  for (const [method, url] of [['GET', '/api/categories'], ['POST', '/api/categories'], ['GET', '/api/categories/1'], ['PATCH', '/api/categories/1'], ['DELETE', '/api/categories/1']]) {
    for (const headers of [{}, { authorization: 'Bearer invalid' }, revoked]) {
      const response = await app.inject({ method, url, headers, ...(['POST', 'PATCH'].includes(method) ? { payload } : {}) })
      assert.equal(response.statusCode, 401)
    }
  }
  assert.equal(rows.length, 0)
})

test('get one category returns the requested category only to its owner', async (t) => {
  const { app, login } = await fixture(t)
  const alice = login(1)
  const bob = login(2)
  const first = await app.inject({ method: 'POST', url: '/api/categories', headers: alice, payload })
  const second = await app.inject({ method: 'POST', url: '/api/categories', headers: alice, payload: { ...payload, name: 'Bank', type: 'income' } })
  const id = second.json().data.id
  assert.notEqual(first.json().data.id, id)

  const response = await app.inject({ method: 'GET', url: `/api/categories/${id}`, headers: alice })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), second.json())
  assert.equal(response.json().data.userId, undefined)

  const forbidden = await app.inject({ method: 'GET', url: `/api/categories/${id}`, headers: bob })
  const missing = await app.inject({ method: 'GET', url: '/api/categories/2147483647', headers: alice })
  assert.equal(forbidden.statusCode, 404)
  assert.equal(missing.statusCode, 404)
  assert.deepEqual(forbidden.json(), missing.json())
  assert.deepEqual(missing.json(), {
    success: false,
    statusCode: 404,
    errors: ['Category was not found']
  })
})

test('get one category rejects invalid IDs before accessing the database', async (t) => {
  const { app, login } = await fixture(t)
  const headers = login(1)
  app.db.getRepository(Category).findOneBy = async () => {
    assert.fail('Invalid IDs must not reach the repository')
  }
  for (const id of ['0', '-1', '1.5', 'abc', '2147483648', '9007199254740993']) {
    const response = await app.inject({ method: 'GET', url: `/api/categories/${id}`, headers })
    assert.equal(response.statusCode, 400, id)
    assert.equal(response.json().success, false)
  }
})

test('patch updates supplied fields, preserves other categories and ignores protected fields', async (t) => {
  const { app, rows, login } = await fixture(t)
  const headers = login(1)
  const created = await app.inject({ method: 'POST', url: '/api/categories', headers, payload })
  await app.inject({ method: 'POST', url: '/api/categories', headers, payload: { ...payload, name: 'Savings' } })
  const original = created.json().data
  const other = { ...rows[1] }
  const url = `/api/categories/${original.id}`
  const renamed = await app.inject({ method: 'PATCH', url, headers, payload: { name: '  Wallet  ', userId: 2, id: 999, currency: 'USD', createdAt: '2000-01-01' } })
  assert.equal(renamed.statusCode, 200)
  assert.equal(renamed.json().data.name, 'Wallet')
  assert.equal(renamed.json().data.type, original.type)
  assert.equal(renamed.json().data.createdAt, original.createdAt)
  assert.equal(renamed.json().data.id, original.id)
  assert.equal(renamed.json().data.userId, undefined)
  assert.equal(rows[0].userId, 1)
  const changed = await app.inject({ method: 'PATCH', url, headers, payload: { type: 'income' } })
  assert.equal(changed.statusCode, 200)
  assert.equal(changed.json().data.type, 'income')
  assert.equal(changed.json().data.name, 'Wallet')
  const fetched = await app.inject({ method: 'GET', url, headers })
  assert.deepEqual(fetched.json(), changed.json())
  assert.deepEqual(rows[1], other)
})

test('patch returns identical 404 for missing and other users categories without mutation', async (t) => {
  const { app, rows, login } = await fixture(t)
  const alice = login(1)
  const bob = login(2)
  await app.inject({ method: 'POST', url: '/api/categories', headers: alice, payload })
  const before = JSON.stringify(rows)
  const denied = await app.inject({ method: 'PATCH', url: '/api/categories/1', headers: bob, payload: { type: 'income' } })
  const missing = await app.inject({ method: 'PATCH', url: '/api/categories/999', headers: alice, payload: { name: 'Missing' } })
  assert.equal(denied.statusCode, 404)
  assert.equal(missing.statusCode, 404)
  assert.deepEqual(denied.json(), missing.json())
  assert.equal(JSON.stringify(rows), before)
})

test('patch rejects invalid IDs and bodies before updating', async (t) => {
  const { app, login } = await fixture(t)
  const headers = login(1)
  app.db.getRepository(Category).update = async () => {
    assert.fail('Invalid input must not reach update')
  }
  for (const body of [
    {}, { userId: 2 }, { currency: 'RUB' }, { name: '' }, { name: '   ' },
    { name: null }, { name: 'a'.repeat(101) }, { type: 'credit' }, { type: null }
  ]) {
    const response = await app.inject({ method: 'PATCH', url: '/api/categories/1', headers, payload: body })
    assert.equal(response.statusCode, 400, JSON.stringify(body))
  }
  for (const id of ['0', '-1', '1.5', 'abc', '2147483648']) {
    const response = await app.inject({ method: 'PATCH', url: `/api/categories/${id}`, headers, payload: { name: 'Wallet' } })
    assert.equal(response.statusCode, 400, id)
  }
})


test('delete removes only the requested category and returns an empty 204', async (t) => {
  const { app, rows, login } = await fixture(t)
  const headers = login(1)
  await app.inject({ method: 'POST', url: '/api/categories', headers, payload })
  await app.inject({ method: 'POST', url: '/api/categories', headers, payload: { ...payload, name: 'Travel' } })
  const other = { ...rows[1] }
  const response = await app.inject({ method: 'DELETE', url: '/api/categories/1', headers })
  assert.equal(response.statusCode, 204)
  assert.equal(response.body, '')
  assert.deepEqual(rows, [other])
  const fetched = await app.inject({ method: 'GET', url: '/api/categories/1', headers })
  assert.equal(fetched.statusCode, 404)
  const repeated = await app.inject({ method: 'DELETE', url: '/api/categories/1', headers })
  assert.equal(repeated.statusCode, 404)
  const listed = await app.inject({ method: 'GET', url: '/api/categories', headers })
  assert.deepEqual(listed.json().data.map((row) => row.id), [other.id])
})

test('delete hides other users categories and leaves them unchanged', async (t) => {
  const { app, rows, login } = await fixture(t)
  const alice = login(1)
  const bob = login(2)
  await app.inject({ method: 'POST', url: '/api/categories', headers: alice, payload })
  const before = JSON.stringify(rows)
  const denied = await app.inject({ method: 'DELETE', url: '/api/categories/1', headers: bob })
  const missing = await app.inject({ method: 'DELETE', url: '/api/categories/999', headers: alice })
  assert.equal(denied.statusCode, 404)
  assert.equal(missing.statusCode, 404)
  assert.deepEqual(denied.json(), missing.json())
  assert.equal(JSON.stringify(rows), before)
})

test('delete validates IDs and authentication before deleting', async (t) => {
  const { app, sessions, login } = await fixture(t)
  const headers = login(1)
  app.db.getRepository(Category).delete = async () => {
    assert.fail('Invalid or unauthenticated requests must not reach delete')
  }
  for (const id of ['0', '-1', '1.5', 'abc', '2147483648', '9007199254740993']) {
    const response = await app.inject({ method: 'DELETE', url: `/api/categories/${id}`, headers })
    assert.equal(response.statusCode, 400, id)
  }
  sessions.clear()
  for (const auth of [{}, { authorization: 'Bearer invalid' }, headers]) {
    const response = await app.inject({ method: 'DELETE', url: '/api/categories/1', headers: auth })
    assert.equal(response.statusCode, 401)
  }
})
