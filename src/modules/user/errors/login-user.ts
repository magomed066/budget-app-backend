import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { AppError } from '../../../shared/errors/app-error'

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password', {
      code: 'INVALID_CREDENTIALS',
      statusCode: HTTP_STATUS.UNAUTHORIZED
    })
  }
}
