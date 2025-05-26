"use client";

import { signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { Center, Spinner, Text, Alert, AlertIcon } from "@chakra-ui/react";

const SignOut = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut({
          callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/',
        });
      } catch (err) {
        setError("Error al cerrar sesión. Por favor intenta nuevamente.");
        console.error("Sign out error:", err);
      }
    };

    handleSignOut();
  }, []);

  if (error) {
    return (
      <Center flexDirection="column" mt={10}>
        <Alert status="error" maxW="md">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

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