import { Repository } from 'typeorm'

import { UserAlreadyExistsError } from '../errors'
import { User } from '../user.schema'
import { UpdateUserInput } from './update-user.schema'

export class UpdateUserRepository {
  constructor(private readonly users: Repository<User>) {}

  async update(id: number, input: UpdateUserInput): Promise<User | null> {
    const user = await this.users.findOneBy({ id })

    if (!user) {
      return null
    }

    Object.assign(user, input)

    try {
      return await this.users.save(user)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505' &&
        input.email
      ) {
        throw new UserAlreadyExistsError(input.email)
      }

      throw error
    }
  }
}
