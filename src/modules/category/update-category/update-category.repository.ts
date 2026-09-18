import { Repository } from 'typeorm'
import { Category } from '../category.schema'
import { UpdateCategoryInput } from './update-category.schema'

export class UpdateCategoryRepository {
  constructor(private readonly categories: Repository<Category>) {}

  async update(
    categoryId: number,
    userId: number,
    input: UpdateCategoryInput
  ): Promise<Category | null> {
    // Scope the write itself to the owner and update only supplied fields.
    const result = await this.categories.update(
      { id: categoryId, userId },
      { ...input }
    )
    if (!result.affected) return null

    return this.categories.findOneBy({ id: categoryId, userId })
  }
}
