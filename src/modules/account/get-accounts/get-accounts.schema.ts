import { FastifySchema } from 'fastify'
import { accountResponseSchema } from '../account-response'

export const getAccountsSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean', const: true },
        data: { type: 'array', items: accountResponseSchema }
      }
    }
  }
}
