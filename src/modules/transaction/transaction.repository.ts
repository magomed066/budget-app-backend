import { DataSource, EntityManager } from 'typeorm'
import { Account } from '../account/account.schema'
import { Category } from '../category/category.schema'
import { AccountNotFoundError } from '../account/errors/get-account'
import { CategoryNotFoundError } from '../category/errors/get-category'
import { AppError } from '../../shared/errors/app-error'
import { Transaction } from './transaction.schema'
import { TransactionInput, TransactionQuery } from './transaction-request.schema'

export class TransactionRepository {
  constructor(private readonly db: DataSource) {}

  findById(id: number, userId: number): Promise<Transaction | null> {
    return this.db.getRepository(Transaction).findOne({
      where: { id, userId },
      relations: { account: true, category: true }
    })
  }

  list(userId: number, query: TransactionQuery): Promise<Transaction[]> {
    return this.db.getRepository(Transaction).find({
      relations: { account: true, category: true },
      where: { userId, ...(query.accountId !== undefined ? { accountId: query.accountId } : {}),
        ...(query.categoryId !== undefined ? { categoryId: query.categoryId } : {}) },
      order: { date: 'DESC', id: 'DESC' }, take: query.limit ?? 50, skip: query.offset ?? 0
    })
  }

  private async validateReferences(manager: EntityManager, userId: number, input: TransactionInput): Promise<void> {
    const account = await manager.getRepository(Account).findOneBy({ id: input.accountId, userId })
    if (!account) throw new AccountNotFoundError()
    const category = await manager.getRepository(Category).findOneBy({ id: input.categoryId, userId })
    if (!category) throw new CategoryNotFoundError()
    if (category.type !== input.type) {
      throw new AppError('Transaction type must match its category', { code: 'TRANSACTION_TYPE_MISMATCH', statusCode: 400 })
    }
  }

  create(userId: number, input: TransactionInput): Promise<Transaction> {
    return this.db.transaction(async manager => {
      await this.validateReferences(manager, userId, input)
      const repository = manager.getRepository(Transaction)
      return repository.save(repository.create({ ...input, note: input.note ?? null, userId }))
    })
  }

  update(id: number, userId: number, input: Partial<TransactionInput>): Promise<Transaction | null> {
    return this.db.transaction(async manager => {
      const repository = manager.getRepository(Transaction)
      const current = await repository.findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } })
      if (!current) return null
      const updated = { ...current, ...input }
      await this.validateReferences(manager, userId, updated)
      return repository.save(updated)
    })
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.db.getRepository(Transaction).delete({ id, userId })
    return (result.affected ?? 0) > 0
  }

  async balance(id: number, userId: number): Promise<{ accountId: number; currency: string; balanceMinor: string } | null> {
    // One SQL snapshot; PostgreSQL numeric arithmetic preserves exact totals.
    const rows = await this.db.query(`
      SELECT a.id AS "accountId", a.currency,
        (a."openingBalanceMinor"::numeric + COALESCE((
          SELECT SUM(CASE WHEN t.type = 'income' THEN t."amountMinor"::numeric ELSE -t."amountMinor"::numeric END)
          FROM transactions t WHERE t."accountId" = a.id AND t."userId" = a."userId"
        ), 0))::text AS "balanceMinor"
      FROM accounts a WHERE a.id = $1 AND a."userId" = $2
    `, [id, userId])
    return rows[0] ?? null
  }
}
