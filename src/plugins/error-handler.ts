import fastifyPlugin from 'fastify-plugin'
import { QueryFailedError } from 'typeorm'
import { FastifySchemaValidationError } from 'fastify'

import { HTTP_STATUS } from '../shared/constants/http-status'
import { AppError } from '../shared/errors/app-error'
import { ErrorResponse } from '../shared/types/global'

interface RequestError extends Error {
  code?: string
  statusCode?: number
  validation?: FastifySchemaValidationError[]
}

const normalizeError = (error: unknown): RequestError =>
  error instanceof Error ? error : new Error('An unknown error was thrown')

const errorHandlerPlugin = fastifyPlugin(
  async (app) => {
    app.setErrorHandler((error, request, reply) => {
      if (error instanceof QueryFailedError && error.driverError.code === '23503' &&
        ['FK_transactions_account_owner', 'FK_transactions_category_owner_type'].includes(error.driverError.constraint)) {
        return reply.code(HTTP_STATUS.CONFLICT).send({
          success: false,
          statusCode: HTTP_STATUS.CONFLICT,
          errors: ['Transaction references must remain valid. Referenced categories cannot be deleted or have their type changed.']
        })
      }

      if (error instanceof AppError) {
        const response: ErrorResponse = {
          success: false,
          statusCode: error.statusCode,
          errors: error.errors
        }

        return reply.code(error.statusCode).send(response)
      }

      const requestError = normalizeError(error)

      if (requestError.validation) {
        const response: ErrorResponse = {
          success: false,
          statusCode: HTTP_STATUS.BAD_REQUEST,
          errors: requestError.validation.map((issue) => {
            const missingProperty = issue.params.missingProperty
            const field = issue.instancePath
              .replace(/^\//, '')
              .replace(/\//g, '.')

            if (typeof missingProperty === 'string') {
              return `${field ? `${field}.` : ''}${missingProperty} is required`
            }

            return field
              ? `${field} ${issue.message ?? 'is invalid'}`
              : issue.message ?? 'Request is invalid'
          })
        }

        return reply.code(HTTP_STATUS.BAD_REQUEST).send(response)
      }

      const statusCode =
        requestError.statusCode &&
        requestError.statusCode >= HTTP_STATUS.BAD_REQUEST &&
        requestError.statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR
          ? requestError.statusCode
          : HTTP_STATUS.INTERNAL_SERVER_ERROR

      if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        request.log.error({ err: requestError }, 'Request failed')
      }

      const response: ErrorResponse = {
        success: false,
        statusCode,
        errors: [
          statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR
            ? 'An unexpected error occurred'
            : requestError.message
        ]
      }

      return reply.code(statusCode).send(response)
    })
  },
  { name: 'error-handler' }
)

export { errorHandlerPlugin }
