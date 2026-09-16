import { FastifySchema } from 'fastify'

import { UserResponse } from '../types/user'

export interface GetUserParams {
  id: number
}

export type GetUserResponse = UserResponse

export const getUserSchema: FastifySchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 }
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
