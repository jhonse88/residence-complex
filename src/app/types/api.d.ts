
export interface User {
    id: number;
    email: string;
    passwordHash: string;
  }
  
export interface Supplier {
  Id: number
  Name: string
  Phone: string
  Email: string
  State: boolean
  averageRating?: number
}

export interface Contract {
  Id: number;
  StartDate: Date | string;
  EndDate: Date | string;
  Amount: number;
  Description: string;
  IdSuppliers: number;
  Suppliers: {
    Id: number;
    Name: string;
  };
}