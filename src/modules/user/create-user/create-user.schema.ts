import { FastifySchema } from 'fastify'
import { UserResponse } from '../types/user'

export interface CreateUserInput {
  email: string
  firstName: string
  lastName: string
  password: string
  phone?: string
}

export interface UserCreateResponse extends UserResponse {
  accessToken: string
  refreshToken: string
}

export const createUserSchema: FastifySchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['email', 'firstName', 'lastName', 'password'],
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      firstName: { type: 'string', minLength: 1, maxLength: 100 },
      lastName: { type: 'string', minLength: 1, maxLength: 100 },
      password: { type: 'string', minLength: 8, maxLength: 128 },
      phone: { type: 'string', minLength: 1, maxLength: 100 }
    }
  },
  response: {
    201: {
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
