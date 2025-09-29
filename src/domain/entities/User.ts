export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly passwordHash: string
  ) {}

  static create(email: string, passwordHash: string): User {
    return new User(0, email, passwordHash)
  }

  static fromPersistence(data: { id: number; email: string; passwordHash: string }): User {
    return new User(data.id, data.email, data.passwordHash)
  }
}
