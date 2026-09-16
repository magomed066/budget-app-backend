import { HTTP_STATUS } from '../constants/http-status'
import { AppError } from './app-error'

export class AuthenticationError extends AppError {
  constructor() {
    super('Authentication required', {
      code: 'AUTHENTICATION_REQUIRED',
      statusCode: HTTP_STATUS.UNAUTHORIZED
    })
  }
}
