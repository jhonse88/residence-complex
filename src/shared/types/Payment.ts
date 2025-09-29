export interface Payment {
  Id: number
  PaymentDate: Date | string
  Amount: number
  PaymentMethod: string
  IdContracts: number
}
