import { accountResponseSchema } from '../account/account-response'
import { categoryResponseSchema } from '../category/category-response'

export interface TransactionInput {
  accountId: number
  categoryId: number
  type: 'income' | 'expense'
  amountMinor: number
  date: string
  note?: string | null
}

export interface TransactionParams { id: number }
export interface TransactionQuery { accountId?: number; categoryId?: number; limit?: number; offset?: number }

const positiveInteger = { type: 'integer', minimum: 1, maximum: 2147483647 }
const strictInteger = { allOf: [{ not: { enum: [null, true, false] } }, positiveInteger] }
export const transactionParamsSchema = {
  type: 'object', required: ['id'], additionalProperties: false,
  properties: { id: positiveInteger }
}
const fields = {
  accountId: strictInteger,
  categoryId: strictInteger,
  type: { type: 'string', enum: ['income', 'expense'] },
  amountMinor: strictInteger,
  date: { type: 'string', format: 'date', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' },
  note: { type: ['string', 'null'], maxLength: 1000 }
}
const responseFields = {
  id: positiveInteger, ...fields,
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' }
}
export const transactionResponse = {
  type: 'object', additionalProperties: false,
  required: Object.keys(responseFields), properties: responseFields
}
export const transactionDetailsResponse = {
  ...transactionResponse,
  required: [...transactionResponse.required, 'account', 'category'],
  properties: {
    ...responseFields,
    account: accountResponseSchema,
    category: categoryResponseSchema
  }
}
export const envelope = (data: object) => ({
  type: 'object', additionalProperties: false, required: ['success', 'data'],
  properties: { success: { type: 'boolean', const: true }, data }
})
export const createTransactionSchema = {
  body: { type: 'object', additionalProperties: false,
    required: ['accountId', 'categoryId', 'type', 'amountMinor', 'date'], properties: fields },
  response: { 201: envelope(transactionResponse) }
}
export const updateTransactionSchema = {
  params: transactionParamsSchema,
  body: { type: 'object', additionalProperties: false, minProperties: 1,
    anyOf: Object.keys(fields).map(key => ({ required: [key] })), properties: fields },
  response: { 200: envelope(transactionResponse) }
}
export const listTransactionsSchema = {
  querystring: { type: 'object', additionalProperties: false, properties: {
    accountId: positiveInteger, categoryId: positiveInteger,
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    offset: { type: 'integer', minimum: 0, maximum: 2147483647, default: 0 }
  } },
  response: { 200: envelope({ type: 'array', items: transactionDetailsResponse }) }
}
