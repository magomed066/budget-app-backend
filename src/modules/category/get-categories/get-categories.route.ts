import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Category } from '../category.schema'
import { GetCategoriesRepository } from './get-categories.repository'
import { getCategoriesSchema } from './get-categories.schema'
import { GetCategoriesService } from './get-categories.service'

export const getCategoriesRoute: FastifyPluginAsync = async (app) => {
  const repository = new GetCategoriesRepository(app.db.getRepository(Category))
  const service = new GetCategoriesService(repository)

  app.get(
    '/categories',
    { schema: getCategoriesSchema, preHandler: requireAuth },
    async (request, reply) => {
      const result = await service.execute(request.userId)
      return reply.code(HTTP_STATUS.OK).send(result)
    }
  )
}
