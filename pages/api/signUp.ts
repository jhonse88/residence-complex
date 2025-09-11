import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/app/lib/prisma'
import bcrypt from 'bcryptjs'

// Capa de Servicio - Lógica de negocio
class UserService {
  async createUser(email: string, password: string) {
    // Validación básica
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    const passwordHash = bcrypt.hashSync(password, 10)

    const user = await prisma.user.create({
      data: { email, passwordHash }
    })

    return user
  }

  async validateUserData(email: string, password: string) {
    const errors: string[] = []

    if (!email) errors.push('Email is required')
    if (!password) errors.push('Password is required')
    if (password && password.length < 6) errors.push('Password must be at least 6 characters')

    return errors
  }
}

// Instancia Singleton del servicio
const userService = new UserService()

// Capa de Controlador - Manejo de requests HTTP
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  try {
    // Validación de datos
    const validationErrors = await userService.validateUserData(email, password)
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: validationErrors.join(', ') })
    }

    // Creación de usuario
    await userService.createUser(email, password)

    return res.status(201).json({ message: 'User created successfully' })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return res.status(400).json({ message: error.message })
      }
      if (error.message === 'Email and password are required') {
        return res.status(400).json({ message: error.message })
      }
    }
    return res.status(500).json({ message: 'Internal server error' })
  }
}
