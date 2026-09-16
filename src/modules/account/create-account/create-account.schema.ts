import { FastifySchema } from 'fastify'
import { accountResponseSchema } from '../account-response'

export interface CreateAccountInput {
  name: string
  type: 'cash' | 'bank'
  currency: 'RUB'
  openingBalanceMinor: number
}

export const createAccountSchema: FastifySchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'type', 'currency', 'openingBalanceMinor'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
      type: { type: 'string', enum: ['cash', 'bank'] },
      currency: { type: 'string', enum: ['RUB'] },
      openingBalanceMinor: {
        type: 'integer',
        minimum: -2147483648,
        maximum: 2147483647
      }
    }
  },
  response: {
    201: {
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
