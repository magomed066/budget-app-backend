import { tokensService } from '../../../plugins/tokens'
import { AuthenticationError } from '../../../shared/errors/authentication-error'
import { RequestResponse } from '../../../shared/types/global'
import { AuthSessionRepository } from '../logout-user/logout-user.repository'
import {
  RefreshTokenInput,
  RefreshTokenResponse
} from './refresh-token.schema'

export class RefreshTokenService {
  constructor(private readonly sessions: AuthSessionRepository) {}

  async execute(
    input: RefreshTokenInput
  ): Promise<RequestResponse<RefreshTokenResponse>> {
    let tokenPayload

    try {
      tokenPayload = tokensService.verifyRefreshToken(input.refreshToken)
    } catch {
      throw new AuthenticationError()
    }

    if (!tokenPayload) {
      throw new AuthenticationError()
    }

    const { accessToken, refreshToken, sessionId, refreshTokenExpiresAt } =
      tokensService.generatePayload({ _id: tokenPayload._id })

    const wasRotated = await this.sessions.rotate(
      tokenPayload.sessionId,
      tokenPayload._id,
      sessionId,
      refreshTokenExpiresAt
    )

    if (!wasRotated) {
      throw new AuthenticationError()
    }

    return {
      success: true,
      data: { accessToken, refreshToken }
    }
  }
}
