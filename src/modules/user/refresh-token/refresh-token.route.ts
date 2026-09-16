import { FastifyPluginAsync } from 'fastify'

import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { AuthSessionRepository } from '../logout-user/logout-user.repository'
import { AuthSession } from '../logout-user/logout-user.schema'
import {
  RefreshTokenInput,
  refreshTokenSchema
} from './refresh-token.schema'
import { RefreshTokenService } from './refresh-token.service'

export const refreshTokenRoute: FastifyPluginAsync = async (app) => {
  const sessions = new AuthSessionRepository(app.db.getRepository(AuthSession))
  const service = new RefreshTokenService(sessions)

  app.post<{ Body: RefreshTokenInput }>(
    '/auth/refresh',
    { schema: refreshTokenSchema },
    async (request, reply) => {
      const tokens = await service.execute(request.body)
      return reply.code(HTTP_STATUS.OK).send(tokens)
    }
  )
}
