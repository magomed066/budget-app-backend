import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Account } from '../account.schema'
import { GetAccountRepository } from './get-account.repository'
import { GetAccountParams, getAccountSchema } from './get-account.schema'
import { GetAccountService } from './get-account.service'

export const getAccountRoute: FastifyPluginAsync = async (app) => {
  const repository = new GetAccountRepository(app.db.getRepository(Account))
  const service = new GetAccountService(repository)

  app.get<{ Params: GetAccountParams }>(
    '/accounts/:id',
    { schema: getAccountSchema, preHandler: requireAuth },
    async (request, reply) => {
      const result = await service.execute(request.params.id, request.userId)
      return reply.code(HTTP_STATUS.OK).send(result)
    }
  )
}
