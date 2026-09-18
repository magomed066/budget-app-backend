import { RequestResponse } from '../../../shared/types/global'
import { Category } from '../category.schema'
import { CreateCategoryRepository } from './create-category.repository'
import { CreateCategoryInput } from './create-category.schema'

export class CreateCategoryService {
  constructor(private readonly repository: CreateCategoryRepository) {}

  async execute(userId: number, input: CreateCategoryInput): Promise<RequestResponse<Category>> {
    const category = await this.repository.create(userId, {
      ...input,
      name: input.name.trim()
    })
    return { success: true, data: category }
  }
}
