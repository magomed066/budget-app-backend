import { FastifySchema } from 'fastify'
import { accountResponseSchema } from '../account-response'

export interface GetAccountParams {
  id: number
}

export const getAccountSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: { type: 'integer', minimum: 1, maximum: 2147483647 }
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
