"use client";

import { SessionProvider } from 'next-auth/react';
import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'

export function Provider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ChakraProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ChakraProvider>
  )
}

