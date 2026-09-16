import { CreateUserInput, UserCreateResponse } from './create-user.schema'
import bcrypt from 'bcrypt'
import { CreateUserRepository } from './create-user.repository'
import { UserAlreadyExistsError } from '../errors'
import { tokensService } from '../../../plugins/tokens'
import { RequestResponse } from '../../../shared/types/global'
import { AuthSessionRepository } from '../logout-user/logout-user.repository'

export class CreateUserService {
  constructor(
    private readonly repository: CreateUserRepository,
    private readonly sessions: AuthSessionRepository
  ) {}

  async execute(
    input: CreateUserInput
  ): Promise<RequestResponse<UserCreateResponse>> {
    const email = input.email.trim().toLowerCase()

    const isUserExisting = await this.repository.checkExistance(email)

    if (isUserExisting) {
      throw new UserAlreadyExistsError(email)
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(input.password, salt)

    const user = await this.repository.create({
      ...input,
      email,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim(),
      password: hashedPassword
    })

    const { password: hashPass, ...userData } = user

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
