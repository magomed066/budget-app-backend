export const categoryResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'name', 'type', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    type: { type: 'string', enum: ['income', 'expense'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}
