export class Payment {
  constructor(
    public readonly id: number,
    public readonly paymentDate: Date,
    public readonly amount: number,
    public readonly paymentMethod: string,
    public readonly contractId: number
  ) {}

  static create(
    paymentDate: Date,
    amount: number,
    paymentMethod: string,
    contractId: number
  ): Payment {
    return new Payment(0, paymentDate, amount, paymentMethod, contractId)
  }

  static fromPersistence(data: {
    Id: number;
    PaymentDate: Date | string;
    Amount: number;
    PaymentMethod: string;
    IdContracts: number;
  }): Payment {
    return new Payment(
      data.Id,
      new Date(data.PaymentDate),
      data.Amount,
      data.PaymentMethod,
      data.IdContracts
    )
  }

  isValidAmount(contractDebt: number): boolean {
    return this.amount > 0 && this.amount <= contractDebt
  }
}
