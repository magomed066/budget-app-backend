import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Account } from '../account.schema'
import { GetAccountsRepository } from './get-accounts.repository'
import { getAccountsSchema } from './get-accounts.schema'
import { GetAccountsService } from './get-accounts.service'

export const getAccountsRoute: FastifyPluginAsync = async (app) => {
  const repository = new GetAccountsRepository(app.db.getRepository(Account))
  const service = new GetAccountsService(repository)

  app.get(
    '/accounts',
    { schema: getAccountsSchema, preHandler: requireAuth },
    async (request, reply) => {
      const result = await service.execute(request.userId)
      return reply.code(HTTP_STATUS.OK).send(result)
    }
  )
}
