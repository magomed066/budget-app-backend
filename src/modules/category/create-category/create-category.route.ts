import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Category } from '../category.schema'
import { CreateCategoryRepository } from './create-category.repository'
import { CreateCategoryInput, createCategorySchema } from './create-category.schema'
import { CreateCategoryService } from './create-category.service'

export const createCategoryRoute: FastifyPluginAsync = async (app) => {
  const repository = new CreateCategoryRepository(app.db.getRepository(Category))
  const service = new CreateCategoryService(repository)

  app.post<{ Body: CreateCategoryInput }>(
    '/categories',
    { schema: createCategorySchema, preHandler: requireAuth },
    async (request, reply) => {
      const result = await service.execute(request.userId, request.body)
      return reply.code(HTTP_STATUS.CREATED).send(result)
    }
  )
}
