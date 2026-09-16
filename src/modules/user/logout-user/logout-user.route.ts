import { FastifyPluginAsync } from 'fastify'

import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { AuthSessionRepository } from './logout-user.repository'
import { AuthSession, logoutUserSchema } from './logout-user.schema'
import { LogoutUserService } from './logout-user.service'

export const logoutUserRoute: FastifyPluginAsync = async (app) => {
  const sessions = new AuthSessionRepository(app.db.getRepository(AuthSession))
  const service = new LogoutUserService(sessions)

  app.post(
    '/auth/logout',
    { schema: logoutUserSchema, preHandler: requireAuth },
    async (request, reply) => {
      await service.execute(request.sessionId, request.userId)
      return reply.code(HTTP_STATUS.NO_CONTENT).send()
    }
  )
}
