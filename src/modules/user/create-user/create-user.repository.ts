import { Repository } from 'typeorm'
import { User } from '../user.schema'
import { CreateUserInput } from './create-user.schema'
import { UserAlreadyExistsError } from '../errors'

export class CreateUserRepository {
  constructor(private readonly users: Repository<User>) {}

  async checkExistance(email: string): Promise<boolean> {
    return this.users.existsBy({
      email
    })
  }

  async create(input: CreateUserInput) {
    try {
      const newUser = await this.users.create(input)
      return await this.users.save(newUser)
    } catch (error) {
      if (this.checkError(error)) {
        throw new UserAlreadyExistsError(input.email)
      }

      throw error
    }
  }

  checkError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    )
  }
}
