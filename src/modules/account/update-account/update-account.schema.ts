import { FastifySchema } from 'fastify'
import { accountResponseSchema } from '../account-response'

export interface UpdateAccountParams {
  id: number
}

export interface UpdateAccountInput {
  name?: string
  type?: 'cash' | 'bank'
  openingBalanceMinor?: number
}

export const updateAccountSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: { type: 'integer', minimum: 1, maximum: 2147483647 }
    }
  },
  body: {
    type: 'object',
    additionalProperties: false,
    minProperties: 1,
    anyOf: [
      { required: ['name'] },
      { required: ['type'] },
      { required: ['openingBalanceMinor'] }
    ],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
      type: { type: 'string', enum: ['cash', 'bank'] },
      openingBalanceMinor: {
        // Reject null before Fastify's default numeric coercion can turn it into zero.
        allOf: [
          { not: { enum: [null] } },
          { type: 'integer', minimum: -2147483648, maximum: 2147483647 }
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
        data: accountResponseSchema
      }
    }
  }
}
