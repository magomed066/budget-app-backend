import { FastifySchema } from 'fastify'
import { categoryResponseSchema } from '../category-response'

export interface CreateCategoryInput {
  name: string
  type: 'income' | 'expense'
}

export const createCategorySchema: FastifySchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'type'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
      type: { type: 'string', enum: ['income', 'expense'] }
    }
  },
  response: {
    201: {
      type: 'object',
      additionalProperties: false,
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean', const: true },
        data: categoryResponseSchema
      }
    }
  }
}
