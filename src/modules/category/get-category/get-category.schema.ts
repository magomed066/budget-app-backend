import { FastifySchema } from 'fastify'
import { categoryResponseSchema } from '../category-response'

export interface GetCategoryParams {
  id: number
}

export const getCategorySchema: FastifySchema = {
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
        data: categoryResponseSchema
      }
    }
  }
}
