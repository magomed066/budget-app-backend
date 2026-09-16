import 'dotenv/config'
import 'reflect-metadata'

import Fastify from 'fastify'

import { createAccountRoute } from './modules/account/create-account/create-account.route'
import { getAccountsRoute } from './modules/account/get-accounts/get-accounts.route'
import { updateAccountRoute } from './modules/account/update-account/update-account.route'
import { getAccountRoute } from './modules/account/get-account/get-account.route'

import { createUserRoute } from './modules/user/create-user/create-user.route'
import { getUserRoute } from './modules/user/get-user/get-user.route'
import { loginUserRoute } from './modules/user/login-user/login-user.route'
import { logoutUserRoute } from './modules/user/logout-user/logout-user.route'
import { refreshTokenRoute } from './modules/user/refresh-token/refresh-token.route'
import { updateUserRoute } from './modules/user/update-user/update-user.route'
import { databasePlugin } from './plugins/database'
import { errorHandlerPlugin } from './plugins/error-handler'

const app = Fastify({ logger: true })
const port = Number(process.env.PORT) || 3000

app.get('/', async (_request, reply) => {
  return reply
    .type('text/html; charset=utf-8')
    .send(`<h1>Server is running on port: ${port}</h1>`)
})

const start = async () => {
  try {
    await app.register(databasePlugin).then(() => {
      console.log('DB is running')
    })
    await app.register(errorHandlerPlugin)

    // API routes

    // Account routes
    await app.register(createAccountRoute, { prefix: '/api' })
    await app.register(getAccountsRoute, { prefix: '/api' })
    await app.register(getAccountRoute, { prefix: '/api' })
    await app.register(updateAccountRoute, { prefix: '/api' })

    // User routes
    await app.register(createUserRoute, { prefix: '/api' })
    await app.register(loginUserRoute, { prefix: '/api' })
    await app.register(logoutUserRoute, { prefix: '/api' })
    await app.register(refreshTokenRoute, { prefix: '/api' })
    await app.register(getUserRoute, { prefix: '/api' })
    await app.register(updateUserRoute, { prefix: '/api' })

    await app.listen({ port, host: '0.0.0.0' })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

void start()
