import { Center, Image } from '@chakra-ui/react'
import { Metadata } from 'next'
import Biomedical from '/src/app/assets/biomedical.png'


export const metadata: Metadata = {
  title: 'Home',
}

export default function Home() {
  return (
    <>
      <Center>
        <Image src='https://www.medisoftcolombia.com/assets/img/logo.png' alt='' borderRadius='lg' />

      </Center>
    </>
  )
}
