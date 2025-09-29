export class Contract {
  constructor(
    public readonly id: number,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly amount: number,
    public readonly debt: number,
    public readonly description: string,
    public readonly supplierId: number,
    public readonly supplier?: { id: number; name: string }
  ) {}

  static create(
    startDate: Date,
    endDate: Date,
    amount: number,
    description: string,
    supplierId: number
  ): Contract {
    return new Contract(0, startDate, endDate, amount, amount, description, supplierId)
  }

  static fromPersistence(data: {
    Id: number;
    StartDate: Date | string;
    EndDate: Date | string;
    Amount: number;
    Debt: number;
    Description: string;
    IdSuppliers: number;
    Suppliers?: { Id: number; Name: string };
  }): Contract {
    return new Contract(
      data.Id,
      new Date(data.StartDate),
      new Date(data.EndDate),
      data.Amount,
      data.Debt,
      data.Description,
      data.IdSuppliers,
      data.Suppliers ? { id: data.Suppliers.Id, name: data.Suppliers.Name } : undefined
    )
  }

  isActive(): boolean {
    const now = new Date()
    return now >= this.startDate && now <= this.endDate
  }

  isExpired(): boolean {
    return new Date() > this.endDate
  }

  getRemainingDebt(): number {
    return this.debt
  }

  updateDebt(newDebt: number): Contract {
    return new Contract(
      this.id,
      this.startDate,
      this.endDate,
      this.amount,
      newDebt,
      this.description,
      this.supplierId,
      this.supplier
    )
  }
}
