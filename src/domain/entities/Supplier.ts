export class Supplier {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly phone: string,
    public readonly email: string,
    public readonly state: boolean,
    public readonly averageRating?: number
  ) {}

  static create(name: string, phone: string, email: string, state: boolean = true): Supplier {
    return new Supplier(0, name, phone, email, state)
  }

  static fromPersistence(data: {
    Id: number;
    Name: string;
    Phone: string;
    Email: string;
    State: boolean;
    averageRating?: number;
  }): Supplier {
    return new Supplier(
      data.Id,
      data.Name,
      data.Phone,
      data.Email,
      data.State,
      data.averageRating
    )
  }

  isActive(): boolean {
    return this.state
  }

  deactivate(): Supplier {
    return new Supplier(this.id, this.name, this.phone, this.email, false, this.averageRating)
  }

  updateInfo(name: string, phone: string, email: string): Supplier {
    return new Supplier(this.id, name, phone, email, this.state, this.averageRating)
  }
}
