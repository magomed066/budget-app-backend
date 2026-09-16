import { FastifyPluginAsync } from 'fastify'

import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { User } from '../user.schema'
import { LoginUserRepository } from './login-user.repository'
import { LoginUserInput, loginUserSchema } from './login-user.schema'
import { LoginUserService } from './login-user.service'
import { AuthSessionRepository } from '../logout-user/logout-user.repository'
import { AuthSession } from '../logout-user/logout-user.schema'

export const loginUserRoute: FastifyPluginAsync = async (app) => {
  const repository = new LoginUserRepository(app.db.getRepository(User))
  const sessions = new AuthSessionRepository(app.db.getRepository(AuthSession))
  const service = new LoginUserService(repository, sessions)

  app.post<{ Body: LoginUserInput }>(
    '/auth/login',
    { schema: loginUserSchema },
    async (request, reply) => {
      const user = await service.execute(request.body)
      return reply.code(HTTP_STATUS.OK).send(user)
    }
  )
}
