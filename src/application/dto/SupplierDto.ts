export interface CreateSupplierDto {
  name: string
  phone: string
  email: string
  state?: boolean
}

export interface UpdateSupplierDto {
  id: number
  name: string
  phone: string
  email: string
  state: boolean
}

export interface SupplierQueryDto {
  searchTerm?: string
  skip?: number
  take?: number
}

export interface SupplierResponseDto {
  id: number
  name: string
  phone: string
  email: string
  state: boolean
  averageRating?: number
}

export interface SupplierListResponseDto {
  suppliers: SupplierResponseDto[]
  count: number
  currentPage: number
  totalPages: number
}
