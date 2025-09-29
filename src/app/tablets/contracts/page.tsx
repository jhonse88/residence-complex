import React from 'react'
import { Metadata } from 'next'
import ContractsTable from '../../../presentation/components/ContractsTable'

export const metadata: Metadata = {
  title: 'Contratos'
}

const ContractsPage = () => {
  return (
    <>
      <ContractsTable />
    </>
  )
}

export default ContractsPage
