import { RequestResponse } from '../../../shared/types/global'
import { UserNotFoundError } from '../errors'
import { GetUserResponse } from './get-user.schema'
import { GetUserRepository } from './get-user.repository'

export class GetUserService {
  constructor(private readonly repository: GetUserRepository) {}

  async execute(id: number): Promise<RequestResponse<GetUserResponse>> {
    const user = await this.repository.findById(id)

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
