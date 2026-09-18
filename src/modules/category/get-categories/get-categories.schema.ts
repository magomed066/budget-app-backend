import { FastifySchema } from 'fastify'
import { categoryResponseSchema } from '../category-response'

export const getCategoriesSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean', const: true },
        data: { type: 'array', items: categoryResponseSchema }
      }
    }
  }
}
