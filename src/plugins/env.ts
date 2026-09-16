import 'dotenv/config'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optionalNumberEnv(
  name: string,
  defaultValue?: number
): number | undefined {
  const value = process.env[name]
  if (value === undefined || value === '') return defaultValue
  const n = Number(value)
  if (Number.isNaN(n)) {
    throw new Error(`Invalid number for environment variable ${name}: ${value}`)
  }
  return n
}

export const DB_NAME = requireEnv('DB_NAME')
export const DB_USER_NAME = requireEnv('DB_USER_NAME')
export const DB_PASSWORD = requireEnv('DB_PASSWORD')
export const DB_HOST = requireEnv('DB_HOST')
export const DB_PORT = optionalNumberEnv('DB_PORT')

export const PORT = optionalNumberEnv('PORT', 3000) ?? 3000

export const JWT_ACCESS_TOKEN = requireEnv('JWT_ACCESS_TOKEN')
export const JWT_REFRESH_TOKEN = requireEnv('JWT_REFRESH_TOKEN')

export const JWT_ACCESS_EXPIRES_IN = requireEnv('JWT_ACCESS_EXPIRES_IN')
export const JWT_REFRESH_EXPIRES_IN = requireEnv('JWT_REFRESH_EXPIRES_IN')
