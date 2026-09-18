import { FastifySchema } from 'fastify'
import { categoryResponseSchema } from '../category-response'

export interface UpdateCategoryParams {
  id: number
}

export interface UpdateCategoryInput {
  name?: string
  type?: 'income' | 'expense'
}

export const updateCategorySchema: FastifySchema = {
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
      { required: ['type'] }
    ],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
      type: { type: 'string', enum: ['income', 'expense'] }
    }
  },
  response: {
    200: {
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
