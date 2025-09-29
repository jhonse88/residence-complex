import { PrismaClient } from '@prisma/client'
import { IUserRepository } from '../../domain/repositories/IUserRepository'
import { User } from '../../domain/entities/User'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { id }
    })

    if (!data) return null

    return this.mapToEntity(data)
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { email }
    })

    if (!data) return null

    return this.mapToEntity(data)
  }

  async create(user: User): Promise<User> {
    const data = await this.prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash
      }
    })

    return this.mapToEntity(data)
  }

  async update(user: User): Promise<User> {
    const data = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        passwordHash: user.passwordHash
      }
    })

    return this.mapToEntity(data)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    })
  }

  private mapToEntity(data: any): User {
    return User.fromPersistence({
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash
    })
  }
}
