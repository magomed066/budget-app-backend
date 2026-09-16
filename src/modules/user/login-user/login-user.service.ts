import bcrypt from 'bcrypt'

import { tokensService } from '../../../plugins/tokens'
import { RequestResponse } from '../../../shared/types/global'
import { LoginUserRepository } from './login-user.repository'
import { LoginUserInput, LoginUserResponse } from './login-user.schema'
import { InvalidCredentialsError } from '../errors'
import { AuthSessionRepository } from '../logout-user/logout-user.repository'

export class LoginUserService {
  constructor(
    private readonly repository: LoginUserRepository,
    private readonly sessions: AuthSessionRepository
  ) {}

  async execute(
    input: LoginUserInput
  ): Promise<RequestResponse<LoginUserResponse>> {
    const email = input.email.trim().toLowerCase()
    const user = await this.repository.findByEmail(email)

    if (!user) {
      throw new InvalidCredentialsError()
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password)

    if (!isValidPassword) {
      throw new InvalidCredentialsError()
    }

    const { password, ...userData } = user
    const { accessToken, refreshToken, sessionId, refreshTokenExpiresAt } =
      tokensService.generatePayload({ _id: userData.id })

    await this.sessions.create(sessionId, userData.id, refreshTokenExpiresAt)

    return {
      success: true,
      data: {
        ...userData,
        accessToken,
        refreshToken
      }
    }
  }
}
