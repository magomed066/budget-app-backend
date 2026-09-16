import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Account } from '../account.schema'
import { UpdateAccountRepository } from './update-account.repository'
import { UpdateAccountInput, UpdateAccountParams, updateAccountSchema } from './update-account.schema'
import { UpdateAccountService } from './update-account.service'

export const updateAccountRoute: FastifyPluginAsync = async (app) => {
  const repository = new UpdateAccountRepository(app.db.getRepository(Account))
  const service = new UpdateAccountService(repository)

  app.patch<{ Params: UpdateAccountParams; Body: UpdateAccountInput }>(
    '/accounts/:id',
    { schema: updateAccountSchema, preHandler: requireAuth },
    async (request, reply) => {
      const result = await service.execute(request.params.id, request.userId, request.body)
      return reply.code(HTTP_STATUS.OK).send(result)
    }
  )
}
