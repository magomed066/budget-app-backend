import { FastifyPluginAsync } from 'fastify'

import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { User } from '../user.schema'
import { CreateUserRepository } from './create-user.repository'
import { CreateUserInput, createUserSchema } from './create-user.schema'
import { CreateUserService } from './create-user.service'
import { AuthSessionRepository } from '../logout-user/logout-user.repository'
import { AuthSession } from '../logout-user/logout-user.schema'

export const createUserRoute: FastifyPluginAsync = async (app) => {
  const repository = new CreateUserRepository(app.db.getRepository(User))
  const sessions = new AuthSessionRepository(app.db.getRepository(AuthSession))
  const service = new CreateUserService(repository, sessions)

  app.post<{ Body: CreateUserInput }>(
    '/auth/register',
    { schema: createUserSchema },
    async (request, reply) => {
      const user = await service.execute(request.body)
      return reply.code(HTTP_STATUS.CREATED).send(user)
    }
  )
}
