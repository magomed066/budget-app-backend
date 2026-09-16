import { FastifySchema } from 'fastify'
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn
} from 'typeorm'

@Entity({ name: 'auth_sessions' })
export class AuthSession {
  @PrimaryColumn({ type: 'uuid' })
  id!: string

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}

export const logoutUserSchema: FastifySchema = {
  response: {
    204: {
      type: 'null'
    }
  }
}
