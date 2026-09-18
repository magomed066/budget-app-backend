import { AppError } from '../../shared/errors/app-error'
import { AccountNotFoundError } from '../account/errors/get-account'
import { TransactionRepository } from './transaction.repository'
import { TransactionInput, TransactionQuery } from './transaction-request.schema'

const notFound = () => new AppError('Transaction was not found', { code: 'TRANSACTION_NOT_FOUND', statusCode: 404 })

export class TransactionService {
  constructor(private readonly repository: TransactionRepository) {}

  async create(userId: number, input: TransactionInput) {
    return { success: true, data: await this.repository.create(userId, input) }
  }

  async list(userId: number, query: TransactionQuery) {
    return { success: true, data: await this.repository.list(userId, query) }
  }

  async get(id: number, userId: number) {
    const data = await this.repository.findById(id, userId)
    if (!data) throw notFound()
    return { success: true, data }
  }

  async update(id: number, userId: number, input: Partial<TransactionInput>) {
    const data = await this.repository.update(id, userId, input)
    if (!data) throw notFound()
    return { success: true, data }
  }

  async delete(id: number, userId: number) {
    if (!(await this.repository.delete(id, userId))) throw notFound()
  }

  async balance(id: number, userId: number) {
    const data = await this.repository.balance(id, userId)
    if (!data) throw new AccountNotFoundError()
    return { success: true, data }
  }
}
