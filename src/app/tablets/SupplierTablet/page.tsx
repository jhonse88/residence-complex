import React from 'react'
import { Metadata } from 'next'
import SupplierTablet from '@/app/components/SupplierTablet'

export const metadata: Metadata = {
  title: 'Provedores',
}

const Supplier = () => {
  return (
    <>
      <SupplierTablet />
    </>
  )
}

export default Supplier