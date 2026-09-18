import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../plugins/auth'
import { TransactionRepository } from './transaction.repository'
import { TransactionService } from './transaction.service'
import {
  createTransactionSchema,
  envelope,
  listTransactionsSchema,
  TransactionInput,
  TransactionParams,
  transactionParamsSchema,
  TransactionQuery,
  transactionDetailsResponse,
  updateTransactionSchema
} from './transaction-request.schema'

export const transactionRoutes: FastifyPluginAsync = async (app) => {
  const service = new TransactionService(new TransactionRepository(app.db))

  app.post<{ Body: TransactionInput }>(
    '/transactions',
    { schema: createTransactionSchema, preHandler: requireAuth },
    async (request, reply) => {
      return reply
        .code(201)
        .send(await service.create(request.userId, request.body))
    }
  )
  app.get<{ Querystring: TransactionQuery }>(
    '/transactions',
    { schema: listTransactionsSchema, preHandler: requireAuth },
    async (request) => {
      return service.list(request.userId, request.query)
    }
  )
  app.get<{ Params: TransactionParams }>(
    '/transactions/:id',
    {
      schema: {
        params: transactionParamsSchema,
        response: { 200: envelope(transactionDetailsResponse) }
      },
      preHandler: requireAuth
    },
    async (request) => service.get(request.params.id, request.userId)
  )
  app.patch<{ Params: TransactionParams; Body: Partial<TransactionInput> }>(
    '/transactions/:id',
    {
      schema: updateTransactionSchema,
      preHandler: requireAuth
    },
    async (request) =>
      service.update(request.params.id, request.userId, request.body)
  )
  app.delete<{ Params: TransactionParams }>(
    '/transactions/:id',
    {
      schema: { params: transactionParamsSchema },
      preHandler: requireAuth
    },
    async (request, reply) => {
      await service.delete(request.params.id, request.userId)
      return reply.code(204).send()
    }
  )
  app.get<{ Params: TransactionParams }>(
    '/accounts/:id/balance',
    {
      schema: {
        params: transactionParamsSchema,
        response: {
          200: envelope({
            type: 'object',
            additionalProperties: false,
            required: ['accountId', 'currency', 'balanceMinor'],
            properties: {
              accountId: { type: 'integer' },
              currency: { type: 'string', enum: ['RUB'] },
              balanceMinor: { type: 'string', pattern: '^-?[0-9]+$' }
            }
          })
        }
      },
      preHandler: requireAuth
    },
    async (request) => service.balance(request.params.id, request.userId)
  )
}
