import { AuthSessionRepository } from './logout-user.repository'

export class LogoutUserService {
  constructor(private readonly sessions: AuthSessionRepository) {}

  async execute(sessionId: string, userId: number): Promise<void> {
    await this.sessions.revoke(sessionId, userId)
  }
}
