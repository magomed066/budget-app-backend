import { HTTP_STATUS } from '../../../shared/constants/http-status'
import { AppError } from '../../../shared/errors/app-error'

export class AccountNotFoundError extends AppError {
  constructor() {
    super('Account was not found', {
      code: 'ACCOUNT_NOT_FOUND',
      statusCode: HTTP_STATUS.NOT_FOUND
    })
  }
}
