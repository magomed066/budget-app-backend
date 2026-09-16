import { RequestResponse } from '../../../shared/types/global'
import { Account } from '../account.schema'
import { AccountNotFoundError } from '../errors/get-account'
import { UpdateAccountRepository } from './update-account.repository'
import { UpdateAccountInput } from './update-account.schema'

export class UpdateAccountService {
  constructor(private readonly repository: UpdateAccountRepository) {}

  async execute(
    accountId: number,
    userId: number,
    input: UpdateAccountInput
  ): Promise<RequestResponse<Account>> {
    const account = await this.repository.update(accountId, userId, {
      ...input,
      ...(input.name ? { name: input.name.trim() } : {})
    })

    if (!account) throw new AccountNotFoundError()

    return { success: true, data: account }
  }
}
