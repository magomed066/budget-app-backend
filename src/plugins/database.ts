import 'dotenv/config'
import 'reflect-metadata'

import fastifyPlugin from 'fastify-plugin'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER_NAME } from './env'

const appDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER_NAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  entities: [join(__dirname, '../modules/**/*.schema.{js,ts}')],
  migrations: [join(__dirname, '../migrations/*.{js,ts}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development'
})

declare module 'fastify' {
  interface FastifyInstance {
    db: DataSource
  }
}

export const databasePlugin = fastifyPlugin(
  async (app) => {
    if (!appDataSource.isInitialized) {
      await appDataSource.initialize()
    }

    app.decorate('db', appDataSource)

    app.addHook('onClose', async () => {
      if (appDataSource.isInitialized) {
        await appDataSource.destroy()
      }
    })
  },
  { name: 'database' }
)

export default appDataSource
