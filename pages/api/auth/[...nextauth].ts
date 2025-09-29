import NextAuth from 'next-auth'
import { authOptions } from '../../../src/infrastructure/config/authOptions'

export default NextAuth(authOptions)