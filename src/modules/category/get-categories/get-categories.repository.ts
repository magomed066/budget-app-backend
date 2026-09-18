import { Repository } from 'typeorm'
import { Category } from '../category.schema'

export class GetCategoriesRepository {
  constructor(private readonly categories: Repository<Category>) {}

  findByUserId(userId: number): Promise<Category[]> {
    return this.categories.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' }
    })
  }
}
