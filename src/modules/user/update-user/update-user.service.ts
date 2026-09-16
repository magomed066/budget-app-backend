import { RequestResponse } from '../../../shared/types/global'
import { UserNotFoundError } from '../errors'
import { UpdateUserRepository } from './update-user.repository'
import {
  UpdateUserInput,
  UpdateUserResponse
} from './update-user.schema'

export class UpdateUserService {
  constructor(private readonly repository: UpdateUserRepository) {}

  async execute(
    id: number,
    input: UpdateUserInput
  ): Promise<RequestResponse<UpdateUserResponse>> {
    const normalizedInput: UpdateUserInput = {
      ...(input.email !== undefined && {
        email: input.email.trim().toLowerCase()
      }),
      ...(input.firstName !== undefined && {
        firstName: input.firstName.trim()
      }),
      ...(input.lastName !== undefined && {
        lastName: input.lastName.trim()
      }),
      ...(input.phone !== undefined && {
        phone: input.phone === null ? null : input.phone.trim()
      })
    }

    const user = await this.repository.update(id, normalizedInput)

    if (!user) {
      throw new UserNotFoundError(id)
    }

    const { password, ...profile } = user

    return {
      success: true,
      data: profile
    }
  }
}
