import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../plugins/auth'
import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { Category } from '../category.schema'
import { UpdateCategoryRepository } from './update-category.repository'
import { UpdateCategoryInput, UpdateCategoryParams, updateCategorySchema } from './update-category.schema'
import { UpdateCategoryService } from './update-category.service'

export const updateCategoryRoute: FastifyPluginAsync = async (app) => {
  const repository = new UpdateCategoryRepository(app.db.getRepository(Category))
  const service = new UpdateCategoryService(repository)

  app.patch<{ Params: UpdateCategoryParams; Body: UpdateCategoryInput }>(
    '/categories/:id',
    { schema: updateCategorySchema, preHandler: requireAuth },
    async (request, reply) => {
      const result = await service.execute(request.params.id, request.userId, request.body)
      return reply.code(HTTP_STATUS.OK).send(result)
    }
  )
}
