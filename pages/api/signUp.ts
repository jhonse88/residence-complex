// src/pages/api/users.ts
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/app/lib/prisma'
import bcrypt from 'bcryptjs'
import Joi from 'joi'

// ---------------------------
// Definición de errores tipados
// ---------------------------
class ValidationError extends Error {}
class ConflictError extends Error {}

// ---------------------------
// Validación con Joi
// ---------------------------
const userSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email no es válido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  })
})

// ---------------------------
// Capa de Servicio - Lógica de negocio
// ---------------------------
class UserService {
  async createUser(email: string, password: string) {
    const { error, value } = userSchema.validate({ email, password }, { abortEarly: false })
    if (error) {
      throw new ValidationError(error.details.map(d => d.message).join(', '))
    }

    const existingUser = await prisma.user.findUnique({ where: { email: value.email } })
    if (existingUser) {
      throw new ConflictError('El usuario ya existe')
    }

    const passwordHash = bcrypt.hashSync(value.password, 10)

    return prisma.user.create({
      data: { email: value.email, passwordHash }
    })
  }
}

// Instancia normal (sin Singleton rígido)
const userService = new UserService()

// ---------------------------
// Capa de Controlador - Manejo de requests HTTP
// ---------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Método no permitido' })
    }

    const { email, password } = req.body

    await userService.createUser(email, password)

    return res.status(201).json({ message: 'Usuario creado correctamente' })
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message })
    }
    if (error instanceof ConflictError) {
      return res.status(409).json({ error: error.message })
    }
    console.error('Error en creación de usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
