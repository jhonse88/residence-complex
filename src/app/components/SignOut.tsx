"use client";

import { signOut } from "next-auth/react";
import React, { useEffect } from "react";
import { Center, Spinner, Text } from "@chakra-ui/react";

const SignOut = () => {
  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({
        callbackUrl: "/",
      });
    };

    handleSignOut();
  }, []);

  return (
    <Center flexDirection="column" mt={10}>
      <Spinner size="xl" color="teal.500" />
      <Text mt={4} fontSize="lg" color="gray.600">
        Cerrando sesión...
      </Text>
    </Center>
  );
};

export default SignOut;
