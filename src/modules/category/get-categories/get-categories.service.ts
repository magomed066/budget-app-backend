import { RequestResponse } from '../../../shared/types/global'
import { Category } from '../category.schema'
import { GetCategoriesRepository } from './get-categories.repository'

export class GetCategoriesService {
  constructor(private readonly repository: GetCategoriesRepository) {}

  async execute(userId: number): Promise<RequestResponse<Category[]>> {
    return {
      success: true,
      data: await this.repository.findByUserId(userId)
    }
  }
}
