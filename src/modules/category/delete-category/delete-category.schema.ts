import { FastifySchema } from 'fastify'

export interface DeleteCategoryParams {
  id: number
}

export const deleteCategorySchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: { type: 'integer', minimum: 1, maximum: 2147483647 }
    }
  }
}
