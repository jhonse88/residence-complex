export interface Contract {
  Id: number
  StartDate: Date | string
  EndDate: Date | string
  Amount: number
  Description: string
  IdSuppliers: number
  Suppliers: {
    Id: number
    Name: string
  }
}
