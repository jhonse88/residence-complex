'use client'
import React from 'react'
import {
  Box,
  Link,
  Button,
  Flex,
  Spacer,
  ButtonGroup,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Card,
  CardBody,
  HStack
} from '@chakra-ui/react'
import { HiArrowSmDown, HiUserAdd } from 'react-icons/hi'
import { HiArrowRightOnRectangle } from 'react-icons/hi2'
import { VscSignIn } from 'react-icons/vsc'
import { GrUserWorker } from 'react-icons/gr'
import { useSession } from 'next-auth/react'
import { LiaFileContractSolid } from 'react-icons/lia'
import { HiDocumentReport } from 'react-icons/hi'

export default function NavbarClient() {
  const { data: session, status } = useSession()

  // Mostrar loading mientras se carga la sesión
  if (status === 'loading') {
    return (
      <Card>
        <CardBody>
          <Box p='2' />
          <Flex minWidth='max-content' alignItems='center' gap='4'>
            <Box pl='12'>
              <Link href='/'>Inicio</Link>
            </Box>
            <Spacer />
            <Text>Cargando...</Text>
            <Box pr='4' />
          </Flex>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardBody>
          <Box p='2' />
          <Flex minWidth='max-content' alignItems='center' gap='4'>
            <Box pl='12'>
              <Link href='/'>Inicio</Link>
            </Box>
            {session && session.user?.email ? (
              <>
                <HStack spacing={4}>
                  <Link href='/tablets/suppliers'>
                    <Button
                      leftIcon={<GrUserWorker />}
                      colorScheme="teal"
                      variant="ghost"
                      _hover={{ bg: 'gray.200' }}>
                      Proveedores
                    </Button>
                  </Link>
                  
                  <Menu>
                    <MenuButton
                      as={Button}
                      rightIcon={<HiArrowSmDown />}
                      leftIcon={<LiaFileContractSolid />}
                      colorScheme="teal"
                      variant="ghost"
                      _hover={{ bg: 'gray.200' }}
                      _expanded={{ bg: 'teal.300' }}
                      _focus={{ boxShadow: 'dark-lg' }}>
                      Contratos
                    </MenuButton>
                    <MenuList>
                      <Link href='/tablets/contracts'>
                        <MenuItem>
                          <LiaFileContractSolid />
                          <Box px={2} />
                          Gestión de Contratos
                        </MenuItem>
                      </Link>
                      <Link href='/tablets/reports'>
                        <MenuItem>
                          <HiDocumentReport />
                          <Box px={2} />
                          Reportes de Pagos
                        </MenuItem>
                      </Link>
                    </MenuList>
                  </Menu>
                </HStack>
                <Spacer />
                <Text>Bienvenido {session.user?.email}</Text>
                <ButtonGroup gap='2'>
                  <Link href='/auth/signout'>
                    <Button colorScheme='teal' variant='ghost'>
                      <HiArrowRightOnRectangle />
                      <Box px={2} />
                      Cerrar Sesion
                    </Button>
                  </Link>
                </ButtonGroup>
                <Box pr='4' />
              </>
            ) : (
              <>
                <Spacer />
                <ButtonGroup gap='2'>
                  <Link href='/auth/signin'>
                    <Button colorScheme='teal' variant='ghost'>
                      <VscSignIn />
                      <Box px={2} />
                      Iniciar Sesion
                    </Button>
                  </Link>
                  <Link href='/auth/signup'>
                    <Button colorScheme='teal' variant='ghost'>
                      <HiUserAdd />
                      <Box px={2} />
                      Crear Cuenta
                    </Button>
                  </Link>
                </ButtonGroup>
                <Box pr='4' />
              </>
            )}
          </Flex>
        </CardBody>
      </Card>
    </>
  )
}
