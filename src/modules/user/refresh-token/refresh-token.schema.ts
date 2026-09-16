import { FastifySchema } from 'fastify'

export interface RefreshTokenInput {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export const refreshTokenSchema: FastifySchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string', minLength: 1 }
    }
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          additionalProperties: false,
          required: ['accessToken', 'refreshToken'],
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        }
      }
    }
  }
}
