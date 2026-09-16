import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { AppError } from '../../../shared/errors/app-error'

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`A user with email ${email} already exists`, {
      code: 'USER_ALREADY_EXISTS',
      statusCode: HTTP_STATUS.CONFLICT
    })
  }
}
