import { FastifyPluginAsync } from 'fastify'

import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { User } from '../user.schema'
import { UpdateUserRepository } from './update-user.repository'
import { UpdateUserInput, updateUserSchema } from './update-user.schema'
import { UpdateUserService } from './update-user.service'

export const updateUserRoute: FastifyPluginAsync = async (app) => {
  const repository = new UpdateUserRepository(app.db.getRepository(User))
  const service = new UpdateUserService(repository)

  app.patch<{ Body: UpdateUserInput }>(
    '/auth/update',
    { schema: updateUserSchema, preHandler: requireAuth },
    async (request, reply) => {
      const user = await service.execute(request.userId, request.body)
      return reply.code(HTTP_STATUS.OK).send(user)
    }
  )
}
