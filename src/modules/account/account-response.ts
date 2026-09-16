export const accountResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'name', 'type', 'currency', 'openingBalanceMinor', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    type: { type: 'string', enum: ['cash', 'bank'] },
    currency: { type: 'string', enum: ['RUB'] },
    openingBalanceMinor: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}
