import { Repository } from 'typeorm'
import { Account } from '../account.schema'

export class GetAccountsRepository {
  constructor(private readonly accounts: Repository<Account>) {}

  findByUserId(userId: number): Promise<Account[]> {
    return this.accounts.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' }
    })
  }
}
