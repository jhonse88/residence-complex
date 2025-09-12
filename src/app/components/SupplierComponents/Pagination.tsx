'use client'
import { Box, Button, Center } from '@chakra-ui/react'
import axios from 'axios'
import { FC, useEffect, useState } from 'react'
import { HiArrowNarrowLeft, HiArrowNarrowRight } from 'react-icons/hi'
import React from 'react'
import { Suppliers } from '@prisma/client'

interface Props {
  GetData: (startIndex: number, endIndex: number) => void
  searchTerm: string
  setData: React.Dispatch<React.SetStateAction<Suppliers[]>>
  firstIndex: number
  lastIndex: number
  itemsPerPage: number
  setFirstIndex: React.Dispatch<React.SetStateAction<number>>
  setLastIndex: React.Dispatch<React.SetStateAction<number>>
  totalCount: number // Nueva prop para recibir el total count
  setTotalCount: React.Dispatch<React.SetStateAction<number>> // Nueva prop para actualizar el total
}

const Pagination: FC<Props> = ({
  GetData,
  searchTerm,
  setData,
  firstIndex,
  lastIndex,
  itemsPerPage,
  setFirstIndex,
  setLastIndex,
  totalCount, // Recibimos el total count
  setTotalCount // Recibimos el setter para el total count
}) => {
  const [buttonPreviousEnabled, setButtonPreviousEnabled] = useState(false)
  const [buttonNextEnabled, setButtonNextEnabled] = useState(true)

  useEffect(() => {
    setButtonPreviousEnabled(firstIndex > 0)

    // Ahora podemos calcular directamente sin hacer llamada adicional
    if (totalCount <= lastIndex) {
      setButtonNextEnabled(false)
    } else {
      setButtonNextEnabled(true)
    }
  }, [firstIndex, lastIndex, totalCount]) // Dependencia de totalCount en lugar de hacer llamada API

  const loadNextItems = async () => {
    const newFirstIndex = lastIndex
    const newLatestIndex = lastIndex + itemsPerPage

    try {
      const res = await axios.get('/api/suppliers', {
        params: {
          searchTerm,
          startIndex: newFirstIndex,
          endIndex: newLatestIndex
        }
      })

      if (res && res.data.suppliers) {
        const newSuppliers = res.data.suppliers
        setData(newSuppliers)

        // Actualizar el total count si viene en la respuesta
        if (res.data.count !== undefined) {
          setTotalCount(res.data.count)
        }

        GetData(newFirstIndex, newLatestIndex)
        setFirstIndex(newFirstIndex)
        setLastIndex(newLatestIndex)
        setButtonNextEnabled(newLatestIndex < totalCount)
      }
    } catch (error) {
      console.error('Error al cargar los siguientes proveedores:', error)
    }
  }

  const loadPreviousItems = async () => {
    const newFirstIndex = Math.max(firstIndex - itemsPerPage, 0)
    const newLatestIndex = newFirstIndex + itemsPerPage

    try {
      const res = await axios.get('/api/suppliers', {
        params: {
          searchTerm,
          startIndex: newFirstIndex,
          endIndex: newLatestIndex
        }
      })

      if (res && res.data.suppliers) {
        const newSuppliers = res.data.suppliers
        setData(newSuppliers)

        // Actualizar el total count si viene en la respuesta
        if (res.data.count !== undefined) {
          setTotalCount(res.data.count)
        }

        GetData(newFirstIndex, newLatestIndex)
        setFirstIndex(newFirstIndex)
        setLastIndex(newLatestIndex)
        setButtonPreviousEnabled(newFirstIndex > 0)
        setButtonNextEnabled(true)
      }
    } catch (error) {
      console.error('Error al cargar los proveedores anteriores:', error)
    }
  }

  return (
    <>
      <Box position='fixed' bottom='0' left='0' width='100%' p={4}>
        <Center>
          <Box mx={2}>
            <Button colorScheme='teal' onClick={loadPreviousItems} isDisabled={!buttonPreviousEnabled}>
              <HiArrowNarrowLeft />
            </Button>
          </Box>
          <Box mx={2}>
            <Button colorScheme='teal' onClick={loadNextItems} isDisabled={!buttonNextEnabled}>
              <HiArrowNarrowRight />
            </Button>
          </Box>
        </Center>
      </Box>
    </>
  )
}

export default Pagination
