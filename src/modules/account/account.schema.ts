import {
  Unique,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { User } from '../user/user.schema'

@Entity({ name: 'accounts' })
@Unique('UQ_accounts_id_user', ['id', 'userId'])
export class Account {
  @PrimaryGeneratedColumn()
  id!: number

  @Index('IDX_accounts_user_id')
  @Column({ type: 'integer' })
  userId!: number

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'varchar', length: 10 })
  type!: 'cash' | 'bank'

  @Column({ type: 'varchar', length: 3 })
  currency!: 'RUB'

  @Column({ type: 'integer', default: 0 })
  openingBalanceMinor!: number

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date
}
