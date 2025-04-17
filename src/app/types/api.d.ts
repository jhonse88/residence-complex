
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