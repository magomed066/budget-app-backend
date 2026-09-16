import { FastifyReply, FastifyRequest } from 'fastify'

import { AuthenticationError } from '../shared/errors/authentication-error'
import { AuthSessionRepository } from '../modules/user/logout-user/logout-user.repository'
import { AuthSession } from '../modules/user/logout-user/logout-user.schema'
import { tokensService } from './tokens'

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authorization = request.headers.authorization

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AuthenticationError()
  }

  const token = authorization.substring('Bearer '.length)

  try {
    const user = tokensService.verifyAccessToken(token)

    if (!user) {
      throw new AuthenticationError()
    }

    const sessions = new AuthSessionRepository(
      request.server.db.getRepository(AuthSession)
    )

    if (!(await sessions.isActive(user.sessionId, user._id))) {
      throw new AuthenticationError()
    }

    request.userId = user._id
    request.sessionId = user.sessionId
  } catch {
    throw new AuthenticationError()
  }
}
