import { Repository } from 'typeorm'
import { Account } from '../account.schema'

export class GetAccountRepository {
  constructor(private readonly accounts: Repository<Account>) {}

  findById(accountId: number, userId: number): Promise<Account | null> {
    return this.accounts.findOneBy({ id: accountId, userId })
  }
}
