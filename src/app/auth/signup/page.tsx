import React from 'react'
import SignUpForm from '../../components/SignUpForm'
import { Center, Text } from '@chakra-ui/react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear cuenta',
}

const SignUpPage = () => {
  return (
    <div className='flex flex-col gap-4'>
      <Center>
        <Text className='text-4xl'>
          Crear Cuenta
        </Text></Center>
      <SignUpForm />
    </div>
  )
}

export default SignUpPage