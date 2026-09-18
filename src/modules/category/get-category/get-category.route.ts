import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Category } from '../category.schema'
import { GetCategoryRepository } from './get-category.repository'
import { GetCategoryParams, getCategorySchema } from './get-category.schema'
import { GetCategoryService } from './get-category.service'

export const getCategoryRoute: FastifyPluginAsync = async (app) => {
  const repository = new GetCategoryRepository(app.db.getRepository(Category))
  const service = new GetCategoryService(repository)

  app.get<{ Params: GetCategoryParams }>(
    '/categories/:id',
    { schema: getCategorySchema, preHandler: requireAuth },
    async (request, reply) => {
      const result = await service.execute(request.params.id, request.userId)
      return reply.code(HTTP_STATUS.OK).send(result)
    }
  )
}
