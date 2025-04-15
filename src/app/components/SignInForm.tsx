"use client";

import React, { useCallback, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Button,
  Center,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";
import { TbEye, TbEyeOff } from "react-icons/tb";

const SignInForm = () => {
  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const toast = useToast()

  const handleSubmit = async () => {
    toast({
      title: "Iniciando...",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top",
    });

    try {
      const signInResponse = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInResponse?.error) {
        toast({
          title: "Error",
          description: "El Correo o la Contraseña están mal",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
      } else {
        toast({
          title: "Inicio de sesión exitoso",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
        router.refresh();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar sesión",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      router.refresh();
      router.push("/");
    }
  }, [router, status]);

  return (
    <>
      <Center>
        <Stack spacing={7}>
          <Input
            variant="filled"
            placeholder="Correo@ejemplo.com"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputGroup size="md">
            <Input
              variant="filled"
              pr="4.5rem"
              type={show ? "text" : "password"}
              placeholder="Ingresar contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleClick}>
                {show ? (
                  <TbEye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <TbEyeOff className="text-2xl text-default-400 pointer-events-none" />
                )}
              </Button>
            </InputRightElement>
          </InputGroup>
          <Button
            colorScheme="teal"
            variant="outline"
            size="md"
            onClick={handleSubmit}
          >
            Siguiente
          </Button>
        </Stack>
      </Center>
    </>
  );
};

export default SignInForm;
