// repositories/userRepository.ts
import prisma from '@/app/lib/prisma'

export const userRepository = {
  findByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email }
    })
  }
}
