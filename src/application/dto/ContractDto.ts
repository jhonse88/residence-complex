export interface CreateContractDto {
  startDate: Date | string
  endDate: Date | string
  amount: number
  description?: string
  supplierId: number
}

export interface UpdateContractDto {
  id: number
  startDate: Date | string
  endDate: Date | string
  amount: number
  description?: string
  supplierId: number
}

export interface ContractQueryDto {
  supplierId?: number
  skip?: number
  take?: number
}

export interface ContractResponseDto {
  id: number
  startDate: Date | string
  endDate: Date | string
  amount: number
  debt: number
  description: string
  supplierId: number
  supplier?: {
    id: number
    name: string
  }
}

export interface ContractListResponseDto {
  contracts: ContractResponseDto[]
  count: number
  currentPage: number
  totalPages: number
}
