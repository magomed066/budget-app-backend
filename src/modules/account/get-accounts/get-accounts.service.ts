import { RequestResponse } from '../../../shared/types/global'
import { Account } from '../account.schema'
import { GetAccountsRepository } from './get-accounts.repository'

export class GetAccountsService {
  constructor(private readonly repository: GetAccountsRepository) {}

  async execute(userId: number): Promise<RequestResponse<Account[]>> {
    return {
      success: true,
      data: await this.repository.findByUserId(userId)
    }
  }
}
