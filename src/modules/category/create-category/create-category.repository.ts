import { Repository } from 'typeorm'
import { Category } from '../category.schema'
import { CreateCategoryInput } from './create-category.schema'

export class CreateCategoryRepository {
  constructor(private readonly categories: Repository<Category>) {}

  async create(userId: number, input: CreateCategoryInput): Promise<Category> {
    const category = this.categories.create({
      name: input.name,
      type: input.type,
      userId
    })
    return this.categories.save(category)
  }
}
