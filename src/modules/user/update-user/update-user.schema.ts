import { FastifySchema } from 'fastify'

import { UserResponse } from '../types/user'

export interface UpdateUserInput {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string | null
}

export type UpdateUserResponse = UserResponse

export const updateUserSchema: FastifySchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    minProperties: 1,
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '\\S'
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '\\S'
      },
      phone: {
        anyOf: [
          {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            pattern: '\\S'
          },
          { type: 'null' }
        ]
      }
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
            'updatedAt'
          ],
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
}
