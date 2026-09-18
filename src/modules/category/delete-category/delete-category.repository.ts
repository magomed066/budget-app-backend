import { Repository } from 'typeorm'
import { Category } from '../category.schema'

export class DeleteCategoryRepository {
  constructor(private readonly categories: Repository<Category>) {}

  async delete(categoryId: number, userId: number): Promise<boolean> {
    const result = await this.categories.delete({ id: categoryId, userId })
    return (result.affected ?? 0) > 0
  }
}
