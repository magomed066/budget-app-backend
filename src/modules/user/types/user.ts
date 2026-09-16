export interface UserResponse {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  createdAt: Date
  updatedAt: Date
}
