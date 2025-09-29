import React from 'react'
import { Metadata } from 'next'
import SupplierTablet from '../../../presentation/components/SupplierTablet'

export const metadata: Metadata = {
  title: 'Proveedores'
}

const SuppliersPage = () => {
  return (
    <>
      <SupplierTablet />
    </>
  )
}

export default SuppliersPage
