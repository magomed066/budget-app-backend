import { CategoryNotFoundError } from '../errors/get-category'
import { DeleteCategoryRepository } from './delete-category.repository'

export class DeleteCategoryService {
  constructor(private readonly repository: DeleteCategoryRepository) {}

  async execute(categoryId: number, userId: number): Promise<void> {
    if (!(await this.repository.delete(categoryId, userId))) {
      throw new CategoryNotFoundError()
    }
  }
}
