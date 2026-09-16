declare module 'fastify' {
  interface FastifyRequest {
    userId: number
    sessionId: string
  }
}

export interface RequestResponse<T> {
  success: true
  data: T
}

export interface ErrorResponse {
  success: false
  statusCode: number
  errors: string[]
}
