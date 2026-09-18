import { RequestResponse } from '../../../shared/types/global'
import { Category } from '../category.schema'
import { CategoryNotFoundError } from '../errors/get-category'
import { UpdateCategoryRepository } from './update-category.repository'
import { UpdateCategoryInput } from './update-category.schema'

export class UpdateCategoryService {
  constructor(private readonly repository: UpdateCategoryRepository) {}

  async execute(
    categoryId: number,
    userId: number,
    input: UpdateCategoryInput
  ): Promise<RequestResponse<Category>> {
    const category = await this.repository.update(categoryId, userId, {
      ...input,
      ...(input.name ? { name: input.name.trim() } : {})
    })

    if (!category) throw new CategoryNotFoundError()

    return { success: true, data: category }
  }
}
