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

@Entity({ name: 'categories' })
@Unique('UQ_categories_id_user_type', ['id', 'userId', 'type'])
export class Category {
  @PrimaryGeneratedColumn()
  id!: number

  @Index('IDX_categories_user_id')
  @Column({ type: 'integer' })
  userId!: number

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'varchar', length: 10 })
  type!: 'income' | 'expense'

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date
}
