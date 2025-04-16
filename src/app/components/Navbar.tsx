import React from "react";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
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
import { FaUserInjured } from "react-icons/fa";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  return (
    <>
      <Card>
        <CardBody>
          <Box p="2" />
          <Flex minWidth="max-content" alignItems="center" gap="4">
            <Box pl="12">
              <Link href="/">Inicio</Link>
            </Box>
            {session && session.user?.email ? (
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
                        <FaUserInjured />
                        <Box px={2} />
                        Provedores
                      </MenuItem>
                    </Link>
                  </MenuList>
                </Menu>
                <Spacer />
                <Text>Bienvenido {session.user?.email}</Text>
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
