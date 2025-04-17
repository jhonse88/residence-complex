'use client'
import React from "react";
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
} from "@chakra-ui/react";
import { HiArrowSmDown, HiUserAdd } from "react-icons/hi";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import { VscSignIn } from "react-icons/vsc";
import { GrUserWorker } from "react-icons/gr";
import { useSession } from "next-auth/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Navbar({ initialSession }: { initialSession: any }) {
  const { data: session } = useSession();
  // Usamos la sesión del servidor como estado inicial
  const currentSession = session || initialSession;

  return (
    <>
      <Card>
        <CardBody>
          <Box p="2" />
          <Flex minWidth="max-content" alignItems="center" gap="4">
            <Box pl="12">
              <Link href="/">Inicio</Link>
            </Box>
            {currentSession && currentSession.user?.email ? (
              <>
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<HiArrowSmDown />}
                    _hover={{ bg: "gray.200" }}
                    _expanded={{ bg: "teal.300" }}
                    _focus={{ boxShadow: "dark-lg" }}
                  >
                    Interoperabilidad
                  </MenuButton>
                  <MenuList>
                    <Link href="/tablets/SupplierTablet">
                      <MenuItem>
                        <GrUserWorker />
                        <Box px={2} />
                        Provedores
                      </MenuItem>
                    </Link>
                  </MenuList>
                </Menu>
                <Spacer />
                <Text>Bienvenido {currentSession.user?.email}</Text>
                <ButtonGroup gap="2">
                  <Link href="/auth/signout">
                    <Button colorScheme="teal" variant="ghost">
                      <HiArrowRightOnRectangle />
                      <Box px={2} />
                      Cerrar Sesion
                    </Button>
                  </Link>
                </ButtonGroup>
                <Box pr="4" />
              </>
            ) : (
              <>
                <Spacer />
                <ButtonGroup gap="2">
                  <Link href="/auth/signin">
                    <Button colorScheme="teal" variant="ghost">
                      <VscSignIn />
                      <Box px={2} />
                      Iniciar Sesion
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button colorScheme="teal" variant="ghost">
                      <HiUserAdd />
                      <Box px={2} />
                      Crear Cuenta
                    </Button>
                  </Link>
                </ButtonGroup>
                <Box pr="4" />
              </>
            )}
          </Flex>
        </CardBody>
      </Card>
    </>
  );
}
