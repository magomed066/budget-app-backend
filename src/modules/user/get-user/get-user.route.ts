import { FastifyPluginAsync } from 'fastify'

import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { User } from '../user.schema'
import { GetUserRepository } from './get-user.repository'
import { GetUserParams, getUserSchema } from './get-user.schema'
import { GetUserService } from './get-user.service'

export const getUserRoute: FastifyPluginAsync = async (app) => {
  const repository = new GetUserRepository(app.db.getRepository(User))
  const service = new GetUserService(repository)

  app.get<{ Params: GetUserParams }>(
    '/users/:id',
    { schema: getUserSchema, preHandler: requireAuth },
    async (request, reply) => {
      const user = await service.execute(request.params.id)
      return reply.code(HTTP_STATUS.OK).send(user)
    }
  )
}
