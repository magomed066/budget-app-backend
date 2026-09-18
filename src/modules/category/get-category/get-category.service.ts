import { RequestResponse } from '../../../shared/types/global'
import { Category } from '../category.schema'
import { CategoryNotFoundError } from '../errors/get-category'
import { GetCategoryRepository } from './get-category.repository'

export class GetCategoryService {
  constructor(private readonly repository: GetCategoryRepository) {}

  async execute(categoryId: number, userId: number): Promise<RequestResponse<Category>> {
    const category = await this.repository.findById(categoryId, userId)

    if (!category) {
      throw new CategoryNotFoundError()
    }

    return { success: true, data: category }
  }
}
