import { RequestResponse } from '../../../shared/types/global'
import { Account } from '../account.schema'
import { AccountNotFoundError } from '../errors/get-account'
import { GetAccountRepository } from './get-account.repository'

export class GetAccountService {
  constructor(private readonly repository: GetAccountRepository) {}

  async execute(accountId: number, userId: number): Promise<RequestResponse<Account>> {
    const account = await this.repository.findById(accountId, userId)

    if (!account) {
      throw new AccountNotFoundError()
    }

    return { success: true, data: account }
  }
}
