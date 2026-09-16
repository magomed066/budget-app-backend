import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Account } from '../account.schema'
import { CreateAccountRepository } from './create-account.repository'
import { CreateAccountInput, createAccountSchema } from './create-account.schema'
import { CreateAccountService } from './create-account.service'

export const createAccountRoute: FastifyPluginAsync = async (app) => {
  const repository = new CreateAccountRepository(app.db.getRepository(Account))
  const service = new CreateAccountService(repository)

  app.post<{ Body: CreateAccountInput }>(
    '/accounts',
    { schema: createAccountSchema, preHandler: requireAuth },
    async (request, reply) => {
      const result = await service.execute(request.userId, request.body)
      return reply.code(HTTP_STATUS.CREATED).send(result)
    }
  )
}
