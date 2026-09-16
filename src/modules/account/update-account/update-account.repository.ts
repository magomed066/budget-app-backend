import { Repository } from 'typeorm'
import { Account } from '../account.schema'
import { UpdateAccountInput } from './update-account.schema'

export class UpdateAccountRepository {
  constructor(private readonly accounts: Repository<Account>) {}

  async update(
    accountId: number,
    userId: number,
    input: UpdateAccountInput
  ): Promise<Account | null> {
    // const changes: UpdateAccountInput = {}
    // if (input.name) changes.name = input.name
    // if (input.type) changes.type = input.type
    // if (input.openingBalanceMinor) {
    //   changes.openingBalanceMinor = input.openingBalanceMinor
    // }

    // Scope the write itself to the owner and update only supplied fields.
    const result = await this.accounts.update(
      { id: accountId, userId },
      { ...input }
    )
    if (!result.affected) return null

    return this.accounts.findOneBy({ id: accountId, userId })
  }
}
