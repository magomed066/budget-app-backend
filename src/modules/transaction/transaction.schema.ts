import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Account } from '../account/account.schema'
import { Category } from '../category/category.schema'

@Entity({ name: 'transactions' })
@Check('CHK_transactions_amount', '"amountMinor" > 0')
@Check('CHK_transactions_type', '"type" IN (\'income\', \'expense\')')
@Index('IDX_transactions_user_date', ['userId', 'date', 'id'])
@Index('IDX_transactions_account_owner', ['accountId', 'userId'])
@Index('IDX_transactions_category_owner_type', ['categoryId', 'userId', 'type'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'integer' })
  userId!: number

  @Column({ type: 'integer' })
  accountId!: number

  @Column({ type: 'integer' })
  categoryId!: number

  @Column({ type: 'varchar', length: 10 })
  type!: 'income' | 'expense'

  @ManyToOne(() => Account, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn([
    { name: 'accountId', referencedColumnName: 'id', foreignKeyConstraintName: 'FK_transactions_account_owner' },
    { name: 'userId', referencedColumnName: 'userId' }
  ])
  account!: Account

  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn([
    { name: 'categoryId', referencedColumnName: 'id', foreignKeyConstraintName: 'FK_transactions_category_owner_type' },
    { name: 'userId', referencedColumnName: 'userId' },
    { name: 'type', referencedColumnName: 'type' }
  ])
  category!: Category

  @Column({ type: 'integer' })
  amountMinor!: number

  @Column({ type: 'date' })
  date!: string

  @Column({ type: 'varchar', length: 1000, nullable: true })
  note!: string | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date
}
