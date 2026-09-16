export interface AppErrorOptions {
  code: string
  statusCode: number
  errors?: string[]
}

export class AppError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly errors: string[]

  constructor(message: string, options: AppErrorOptions) {
    super(message)

    this.name = new.target.name
    this.code = options.code
    this.statusCode = options.statusCode
    this.errors = options.errors ?? [message]
  }
}
