import { Repository } from 'typeorm'
import { Account } from '../account.schema'
import { CreateAccountInput } from './create-account.schema'

export class CreateAccountRepository {
  constructor(private readonly accounts: Repository<Account>) {}

  async create(userId: number, input: CreateAccountInput): Promise<Account> {
    const account = this.accounts.create({
      name: input.name,
      type: input.type,
      currency: input.currency,
      openingBalanceMinor: input.openingBalanceMinor,
      userId
    })
    return this.accounts.save(account)
  }
}
