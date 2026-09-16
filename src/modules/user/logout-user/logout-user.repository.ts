import { IsNull, MoreThan, Repository } from 'typeorm'

import { AuthSession } from './logout-user.schema'

export class AuthSessionRepository {
  constructor(private readonly sessions: Repository<AuthSession>) {}

  async create(id: string, userId: number, expiresAt: Date): Promise<void> {
    await this.sessions.save(
      this.sessions.create({ id, userId, expiresAt, revokedAt: null })
    )
  }

  async isActive(id: string, userId: number): Promise<boolean> {
    return this.sessions.existsBy({
      id,
      userId,
      revokedAt: IsNull(),
      expiresAt: MoreThan(new Date())
    })
  }

  async revoke(id: string, userId: number): Promise<void> {
    await this.sessions.update(
      { id, userId, revokedAt: IsNull() },
      { revokedAt: new Date() }
    )
  }

  async rotate(
    id: string,
    userId: number,
    newId: string,
    expiresAt: Date
  ): Promise<boolean> {
    return this.sessions.manager.transaction(async (manager) => {
      const sessions = manager.getRepository(AuthSession)
      const revokedAt = new Date()
      const result = await sessions.update(
        {
          id,
          userId,
          revokedAt: IsNull(),
          expiresAt: MoreThan(revokedAt)
        },
        { revokedAt }
      )

      if (result.affected !== 1) {
        return false
      }

      await sessions.save(
        sessions.create({
          id: newId,
          userId,
          expiresAt,
          revokedAt: null
        })
      )

      return true
    })
  }
}
