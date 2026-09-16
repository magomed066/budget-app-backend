import { FastifySchema } from 'fastify'

import { UserResponse } from '../types/user'

export interface LoginUserInput {
  email: string
  password: string
}

export interface LoginUserResponse extends UserResponse {
  accessToken: string
  refreshToken: string
}

export const loginUserSchema: FastifySchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      password: { type: 'string', minLength: 1, maxLength: 128 }
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
          required: [
            'id',
            'email',
            'firstName',
            'lastName',
            'phone',
            'createdAt',
            'updatedAt',
            'accessToken',
            'refreshToken'
          ],
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        }
      }
    }
  }
}
