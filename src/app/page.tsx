import { Center, Image } from '@chakra-ui/react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
}

export default function Home() {
  return (
    <>
      <Center>
        <Image src='https://st3.depositphotos.com/1768926/12991/v/450/depositphotos_129914996-stock-illustration-property-logo-template.jpg' alt='' borderRadius='lg' />
      </Center>
    </>
  )
}
