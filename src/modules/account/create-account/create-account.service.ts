import { RequestResponse } from '../../../shared/types/global'
import { Account } from '../account.schema'
import { CreateAccountRepository } from './create-account.repository'
import { CreateAccountInput } from './create-account.schema'

export class CreateAccountService {
  constructor(private readonly repository: CreateAccountRepository) {}

  async execute(userId: number, input: CreateAccountInput): Promise<RequestResponse<Account>> {
    const account = await this.repository.create(userId, {
      ...input,
      name: input.name.trim()
    })
    return { success: true, data: account }
  }
}
