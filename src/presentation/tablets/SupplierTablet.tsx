import React from 'react'
import { Metadata } from 'next'
import SupplierTablet from '../components/SupplierTablet'

export const metadata: Metadata = {
  title: 'Provedores'
}

const Supplier = () => {
  return (
    <>
      <SupplierTablet />
    </>
  )
}

export default Supplier
