import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { AppError } from '../../../shared/errors/app-error'

export class UserNotFoundError extends AppError {
  constructor(id: number) {
    super(`User with id ${id} was not found`, {
      code: 'USER_NOT_FOUND',
      statusCode: HTTP_STATUS.NOT_FOUND
    })
  }
}
