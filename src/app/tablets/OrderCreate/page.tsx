import React from 'react'
import { Metadata } from 'next'
import OrderCreate from '@/app/components/OrderComponents/OrderCreate';

export const metadata: Metadata = {
  title: 'Crear Orden',
}

const Order = () => {
  return (
    <>
      <OrderCreate />
    </>
  )
}

export default Order