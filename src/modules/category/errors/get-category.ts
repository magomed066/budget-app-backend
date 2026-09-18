import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { AppError } from '../../../shared/errors/app-error'

export class CategoryNotFoundError extends AppError {
  constructor() {
    super('Category was not found', {
      code: 'CATEGORY_NOT_FOUND',
      statusCode: HTTP_STATUS.NOT_FOUND
    })
  }
}
