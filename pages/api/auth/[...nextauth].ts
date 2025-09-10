import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/app/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextAuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'

// Capa de Servicio - Lógica de autenticación
class AuthService {
  async validateUser(email: string, password: string) {
    if (!email || !password) return null

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) return null

    const isValidPassword = bcrypt.compareSync(password, user.passwordHash)
    if (!isValidPassword) return null

    return {
      id: user.id.toString(),
      email: user.email
    }
  }

  generateToken(payload: any, secret: string | Buffer) {
    // Aseguramos que el secret sea string
    const secretString = typeof secret === 'string' ? secret : secret.toString()
    return jwt.sign(payload, secretString)
  }

  verifyToken(token: string, secret: string | Buffer) {
    try {
      // Aseguramos que el secret sea string
      const secretString = typeof secret === 'string' ? secret : secret.toString()
      return jwt.verify(token, secretString) as JWT
    } catch {
      return null
    }
  }
}

// Instancia Singleton del servicio
const authService = new AuthService()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async credentials => {
        if (!credentials) return null
        return await authService.validateUser(credentials.email, credentials.password)
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout'
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    encode: ({ secret, token }) => {
      if (!token) throw new Error('No token to encode')
      return authService.generateToken(token, secret)
    },
    decode: async ({ secret, token }) => {
      if (!token) return null
      // Aseguramos que token sea string
      const tokenString = typeof token === 'string' ? token : ''
      return authService.verifyToken(tokenString, secret)
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
      }
      return token
    }
  }
}

export default NextAuth(authOptions)
