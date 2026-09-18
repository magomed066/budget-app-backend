import { Repository } from 'typeorm'
import { Category } from '../category.schema'

export class GetCategoryRepository {
  constructor(private readonly categories: Repository<Category>) {}

  findById(categoryId: number, userId: number): Promise<Category | null> {
    return this.categories.findOneBy({ id: categoryId, userId })
  }
}
