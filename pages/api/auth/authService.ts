// services/authService.ts
import bcrypt from 'bcryptjs'
import { userRepository } from './userRepository'

export const authService = {
  validateUser: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email)
    if (!user) return null

    const isValidPassword = bcrypt.compareSync(password, user.passwordHash)
    if (!isValidPassword) return null

    return { id: user.id.toString(), email: user.email }
  }
}
