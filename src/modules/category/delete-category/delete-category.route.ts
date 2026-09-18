import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Category } from '../category.schema'
import { DeleteCategoryRepository } from './delete-category.repository'
import { DeleteCategoryParams, deleteCategorySchema } from './delete-category.schema'
import { DeleteCategoryService } from './delete-category.service'

export const deleteCategoryRoute: FastifyPluginAsync = async (app) => {
  const repository = new DeleteCategoryRepository(app.db.getRepository(Category))
  const service = new DeleteCategoryService(repository)

  app.delete<{ Params: DeleteCategoryParams }>(
    '/categories/:id',
    { schema: deleteCategorySchema, preHandler: requireAuth },
    async (request, reply) => {
      await service.execute(request.params.id, request.userId)
      return reply.code(HTTP_STATUS.NO_CONTENT).send()
    }
  )
}
