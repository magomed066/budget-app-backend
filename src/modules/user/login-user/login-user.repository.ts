import { Repository } from 'typeorm'

import { User } from '../user.schema'

export class LoginUserRepository {
  constructor(private readonly users: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email })
  }
}
