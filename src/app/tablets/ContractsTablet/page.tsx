import React from 'react'
import { Metadata } from 'next'
import ContractsTable from '@/app/components/ContractsTable';

export const metadata: Metadata = {
  title: 'Contratos',
}

const Order = () => {
  return (
    <>
      <ContractsTable />
    </>
  )
}

export default Order