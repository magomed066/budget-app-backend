import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import {
  JWT_ACCESS_EXPIRES_IN,
  JWT_ACCESS_TOKEN,
  JWT_REFRESH_EXPIRES_IN,
  JWT_REFRESH_TOKEN
} from './env'

export interface AccessTokenPayload extends JwtPayload {
  _id: number
  sessionId: string
}

export type RefreshTokenPayload = AccessTokenPayload

function isTokenPayload(payload: string | JwtPayload): payload is AccessTokenPayload {
  return (
    typeof payload === 'object' &&
    Number.isInteger(payload._id) &&
    payload._id > 0 &&
    typeof payload.sessionId === 'string' &&
    payload.sessionId.length > 0
  )
}

class TokensService {
  generatePayload(payload: Pick<AccessTokenPayload, '_id'>): {
    accessToken: string
    refreshToken: string
    sessionId: string
    refreshTokenExpiresAt: Date
  } {
    const sessionId = randomUUID()
    const tokenPayload = { ...payload, sessionId }
    const accessToken = jwt.sign(tokenPayload, JWT_ACCESS_TOKEN, {
      expiresIn: JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
    })

    const refreshToken = jwt.sign(tokenPayload, JWT_REFRESH_TOKEN, {
      expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']
    })

    const decodedRefreshToken = jwt.decode(refreshToken)
    if (
      decodedRefreshToken === null ||
      typeof decodedRefreshToken !== 'object' ||
      typeof decodedRefreshToken.exp !== 'number'
    ) {
      throw new Error('Refresh token has no expiration')
    }

    return {
      accessToken,
      refreshToken,
      sessionId,
      refreshTokenExpiresAt: new Date(decodedRefreshToken.exp * 1000)
    }
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    const userData = jwt.verify(token, JWT_ACCESS_TOKEN)

    return isTokenPayload(userData) ? userData : null
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    const userData = jwt.verify(token, JWT_REFRESH_TOKEN)

    return isTokenPayload(userData) ? userData : null
  }
}

export const tokensService = new TokensService()
