const assert = require('node:assert/strict')
const { test } = require('node:test')
const { join } = require('node:path')
const { randomUUID } = require('node:crypto')
const url = process.env.TRANSACTIONS_TEST_DB_URL
Object.assign(process.env, {
  DB_NAME: 'test', DB_USER_NAME: 'test', DB_PASSWORD: 'test', DB_HOST: 'localhost', DB_PORT: '5432',
  JWT_ACCESS_TOKEN: 'transactions-test-access', JWT_REFRESH_TOKEN: 'transactions-test-refresh',
  JWT_ACCESS_EXPIRES_IN: '15m', JWT_REFRESH_EXPIRES_IN: '7d'
})
require('reflect-metadata')
const { DataSource } = require('typeorm')
const { Client } = require('pg')
const Fastify = require('fastify')
const { User } = require('../dist/modules/user/user.schema')
const { Account } = require('../dist/modules/account/account.schema')
const { Category } = require('../dist/modules/category/category.schema')
const { AuthSession } = require('../dist/modules/user/logout-user/logout-user.schema')
const { transactionRoutes } = require('../dist/modules/transaction/transaction.route')
const { deleteCategoryRoute } = require('../dist/modules/category/delete-category/delete-category.route')
const { updateCategoryRoute } = require('../dist/modules/category/update-category/update-category.route')
const { errorHandlerPlugin } = require('../dist/plugins/error-handler')
const { tokensService } = require('../dist/plugins/tokens')
const { Transaction } = require('../dist/modules/transaction/transaction.schema')

test('transaction GET endpoints serialize account and category details', async t => {
  const timestamps = { createdAt: new Date('2026-09-18T12:00:00Z'), updatedAt: new Date('2026-09-18T12:00:00Z') }
  const account = { id: 2, name: 'Cash', type: 'cash', currency: 'RUB', openingBalanceMinor: 1000, ...timestamps }
  const category = { id: 3, name: 'Food', type: 'expense', ...timestamps }
  const row = { id: 1, userId: 7, accountId: 2, categoryId: 3, type: 'expense', amountMinor: 200,
    date: '2026-09-18', note: null, ...timestamps }
  const hydrate = options => ({ ...row,
    ...(options.relations?.account ? { account: { ...account, userId: 7, user: { password: 'private' } } } : {}),
    ...(options.relations?.category ? { category: { ...category, userId: 7, user: { password: 'private' } } } : {}) })
  const tokens = tokensService.generatePayload({ _id: 7 })
  const app = Fastify()
  t.after(() => app.close())
  app.decorate('db', {
    getRepository(entity) {
      if (entity === AuthSession) return { existsBy: async ({ id, userId }) => id === tokens.sessionId && userId === 7 }
      assert.equal(entity, Transaction)
      return {
        findOne: async options => {
          assert.deepEqual(options.where, { id: 1, userId: 7 })
          return hydrate(options)
        },
        find: async options => {
          assert.deepEqual(options.where, { userId: 7, accountId: 2, categoryId: 3 })
          assert.deepEqual(options.order, { date: 'DESC', id: 'DESC' })
          assert.equal(options.take, 1)
          assert.equal(options.skip, 2)
          return [hydrate(options)]
        }
      }
    }
  })
  await app.register(transactionRoutes, { prefix: '/api' })
  const expected = JSON.parse(JSON.stringify({ ...row, account, category }))
  delete expected.userId
  for (const path of ['/transactions/1', '/transactions?accountId=2&categoryId=3&limit=1&offset=2']) {
    const response = await app.inject({ method: 'GET', url: '/api' + path,
      headers: { authorization: `Bearer ${tokens.accessToken}` } })
    assert.equal(response.statusCode, 200, response.body)
    const data = response.json().data
    assert.deepEqual(Array.isArray(data) ? data : [data], [expected])
  }
})

test('transactions against PostgreSQL', { skip: !url }, async t => {
  // Isolated schema; never use or remove existing application tables.
  const schema = 'transactions_test_' + randomUUID().replaceAll('-', '')
  const admin = new Client({ connectionString: url })
  await admin.connect()
  let db
  let app
  t.after(async () => {
    if (app) await app.close()
    if (db?.isInitialized) await db.destroy()
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await admin.end()
  })
  await admin.query(`CREATE SCHEMA "${schema}"`)
  db = new DataSource({ type: 'postgres', url, schema,
    extra: { options: `-c search_path=${schema}` },
    entities: [join(__dirname, '../dist/modules/**/*.schema.js')],
    migrations: [join(__dirname, '../dist/migrations/*.js')], synchronize: false })
  await db.initialize()
  await db.runMigrations()
  app = Fastify()
  app.decorate('db', db)
  await app.register(errorHandlerPlugin)
  for (const route of [transactionRoutes, deleteCategoryRoute, updateCategoryRoute]) {
    await app.register(route, { prefix: '/api' })
  }
  async function owner(email) {
    const user = await db.getRepository(User).save({ email, firstName: 'Test', lastName: 'User', password: 'unused' })
    const tokens = tokensService.generatePayload({ _id: user.id })
    await db.getRepository(AuthSession).save({ id: tokens.sessionId, userId: user.id, expiresAt: new Date(Date.now() + 600000) })
    const account = await db.getRepository(Account).save({ userId: user.id, name: 'Cash', type: 'cash', currency: 'RUB', openingBalanceMinor: 1000 })
    const expense = await db.getRepository(Category).save({ userId: user.id, name: 'Food', type: 'expense' })
    const income = await db.getRepository(Category).save({ userId: user.id, name: 'Salary', type: 'income' })
    return { user, account, expense, income, headers: { authorization: `Bearer ${tokens.accessToken}` }, sessionId: tokens.sessionId }
  }
  const alice = await owner('alice@test.local')
  const bob = await owner('bob@test.local')
  const input = { accountId: alice.account.id, categoryId: alice.expense.id, type: 'expense', amountMinor: 200, date: '2026-09-18' }
  const request = (method, path, payload, headers = alice.headers) => app.inject({ method, url: '/api' + path, headers, ...(payload !== undefined ? { payload } : {}) })
  const balance = async (account = alice.account) => {
    const response = await request('GET', `/accounts/${account.id}/balance`)
    assert.equal(response.statusCode, 200, response.body)
    return response.json().data.balanceMinor
  }
  let id
  await t.test('create, list, get and exact balance', async () => {
    assert.equal(await balance(), '1000')
    const created = await request('POST', '/transactions', { ...input, userId: bob.user.id })
    assert.equal(created.statusCode, 201, created.body)
    id = created.json().data.id
    assert.equal(created.json().data.userId, undefined)
    assert.equal(created.json().data.note, null)
    assert.equal(await balance(), '800')
    const fetched = await request('GET', `/transactions/${id}`)
    assert.equal(fetched.statusCode, 200, fetched.body)
    const { account, category, ...transaction } = fetched.json().data
    assert.deepEqual(transaction, created.json().data)
    const publicDetails = ({ userId, ...details }) => JSON.parse(JSON.stringify(details))
    assert.deepEqual(account, publicDetails(alice.account))
    assert.deepEqual(category, publicDetails(alice.expense))
    const income = await request('POST', '/transactions', { ...input, categoryId: alice.income.id, type: 'income', amountMinor: 500 })
    assert.equal(income.statusCode, 201)
    assert.equal(await balance(), '1300')
    const listed = await request('GET', '/transactions?limit=1&offset=1')
    assert.deepEqual(listed.json().data.map(row => row.id), [id])
    assert.deepEqual(listed.json().data[0], fetched.json().data)
    const filtered = await request('GET', `/transactions?categoryId=${alice.expense.id}`)
    assert.deepEqual(filtered.json().data.map(row => row.id), [id])
    const other = await request('GET', '/transactions', undefined, bob.headers)
    assert.deepEqual(other.json().data, [])
  })
  await t.test('ownership is enforced on reads, writes and references', async () => {
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      const response = await request(method, `/transactions/${id}`, method === 'PATCH' ? { amountMinor: 99 } : undefined, bob.headers)
      assert.equal(response.statusCode, 404, response.body)
      const missing = await request(method, '/transactions/2147483647', method === 'PATCH' ? { amountMinor: 99 } : undefined)
      assert.deepEqual(response.json(), missing.json())
    }
    for (const patch of [{ accountId: bob.account.id }, { categoryId: bob.expense.id }]) {
      assert.equal((await request('POST', '/transactions', { ...input, ...patch })).statusCode, 404)
      assert.equal((await request('PATCH', `/transactions/${id}`, patch)).statusCode, 404)
    }
    assert.equal((await request('GET', `/accounts/${alice.account.id}/balance`, undefined, bob.headers)).statusCode, 404)
    assert.equal(await balance(), '1300')
  })
  await t.test('invalid bodies, dates, pagination and IDs are rejected', async () => {
    for (const patch of [{ amountMinor: 0 }, { amountMinor: -1 }, { amountMinor: 0.5 }, { amountMinor: 2147483648 },
      { amountMinor: null }, { amountMinor: true }, { accountId: null }, { categoryId: false },
      { date: '2026-02-30' }, { date: '2026-13-01' }, { date: '2026-1-01' }, { note: 'a'.repeat(1001) },
      { type: 'transfer' }, { type: 'income' }]) {
      assert.equal((await request('POST', '/transactions', { ...input, ...patch })).statusCode, 400, JSON.stringify(patch))
      assert.equal((await request('PATCH', `/transactions/${id}`, patch)).statusCode, 400, JSON.stringify(patch))
    }
    for (const body of [{}, { userId: bob.user.id }]) {
      assert.equal((await request('PATCH', `/transactions/${id}`, body)).statusCode, 400)
    }
    for (const invalid of ['0', '-1', '1.5', 'abc', '2147483648']) {
      for (const method of ['GET', 'PATCH', 'DELETE']) {
        assert.equal((await request(method, `/transactions/${invalid}`, method === 'PATCH' ? { amountMinor: 100 } : undefined)).statusCode, 400)
      }
    }
    for (const query of ['limit=0', 'limit=101', 'offset=-1', 'accountId=0']) {
      assert.equal((await request('GET', '/transactions?' + query)).statusCode, 400)
    }
  })
  await t.test('referenced category deletion and type changes return conflict', async () => {
    assert.equal((await request('DELETE', `/categories/${alice.expense.id}`)).statusCode, 409)
    assert.equal((await request('PATCH', `/categories/${alice.expense.id}`, { type: 'income' })).statusCode, 409)
    assert.equal((await request('PATCH', `/categories/${alice.expense.id}`, { name: 'Groceries' })).statusCode, 200)
    assert.equal((await request('DELETE', `/categories/${alice.expense.id}`, undefined, bob.headers)).statusCode, 404)
  })
  await t.test('updates move balances between accounts and preserve omitted fields', async () => {
    const second = await db.getRepository(Account).save({ userId: alice.user.id, name: 'Bank', type: 'bank', currency: 'RUB', openingBalanceMinor: 0 })
    const updated = await request('PATCH', `/transactions/${id}`, { accountId: second.id, amountMinor: 300, note: 'Lunch', userId: bob.user.id })
    assert.equal(updated.statusCode, 200, updated.body)
    assert.equal(updated.json().data.date, input.date)
    assert.equal(await balance(), '1500')
    assert.equal(await balance(second), '-300')
    assert.equal((await request('PATCH', `/transactions/${id}`, { type: 'income', categoryId: alice.income.id, note: null })).statusCode, 200)
    assert.equal(await balance(second), '300')
    const deleted = await request('DELETE', `/transactions/${id}`)
    assert.equal(deleted.statusCode, 204)
    assert.equal(deleted.body, '')
    assert.equal(await balance(second), '0')
    assert.equal((await request('DELETE', `/transactions/${id}`)).statusCode, 404)
    assert.equal((await request('DELETE', `/categories/${alice.expense.id}`)).statusCode, 204)
    await db.getRepository(Account).update({ id: alice.account.id }, { openingBalanceMinor: 2147483647 })
    assert.equal(await balance(), '2147484147')
  })
  await t.test('every endpoint requires an active session', async () => {
    await db.getRepository(AuthSession).update({ id: bob.sessionId }, { revokedAt: new Date() })
    for (const [method, path, body] of [['POST', '/transactions', input], ['GET', '/transactions'], ['GET', `/transactions/${id}`],
      ['PATCH', `/transactions/${id}`, { amountMinor: 10 }], ['DELETE', `/transactions/${id}`], ['GET', `/accounts/${alice.account.id}/balance`]]) {
      for (const headers of [{}, { authorization: 'Bearer invalid' }, bob.headers]) {
        assert.equal((await request(method, path, body, headers)).statusCode, 401)
      }
    }
  })
  await t.test('database constraints reject cross-owner references and mismatched types', async () => {
    for (const [accountId, categoryId, type, amount] of [[bob.account.id, alice.income.id, 'income', 1],
      [alice.account.id, bob.income.id, 'income', 1], [alice.account.id, alice.income.id, 'expense', 1],
      [alice.account.id, alice.income.id, 'income', 0]]) {
      await assert.rejects(db.query(`INSERT INTO transactions ("userId", "accountId", "categoryId", type, "amountMinor", date) VALUES ($1,$2,$3,$4,$5,'2026-09-18')`,
        [alice.user.id, accountId, categoryId, type, amount]), error => ['23503', '23514'].includes(error.driverError.code))
    }
  })
  await t.test('transaction migration reverts and reapplies', async () => {
    await db.undoLastMigration()
    await db.runMigrations()
    assert.equal((await request('GET', '/transactions')).json().data.length, 0)
  })
})
