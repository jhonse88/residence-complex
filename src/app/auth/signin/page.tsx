import SignInForm from '@/app/components/SignInForm'
import { Center } from '@chakra-ui/react'
import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesion',
}

const SignInPage = () => {
  return (
    <div className='flex flex-col gap-4'>
      <Center>
        <h1 className='text-4xl'>
          Iniciar Sesion
        </h1>
      </Center>
      <SignInForm />

    </div>
  )
}

export default SignInPage