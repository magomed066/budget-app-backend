import { Repository } from 'typeorm'

import { User } from '../user.schema'

export class GetUserRepository {
  constructor(private readonly users: Repository<User>) {}

  findById(id: number): Promise<User | null> {
    return this.users.findOneBy({ id })
  }
}
