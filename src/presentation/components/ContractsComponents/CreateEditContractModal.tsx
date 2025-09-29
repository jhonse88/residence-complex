/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import axios from 'axios'
import AsyncSelect from 'react-select/async'
import { ContractResponseDto } from '../../../application/dto/ContractDto'

interface CreateEditContractModalProps {
  isOpen: boolean
  onClose: () => void
  GetContracts: () => void
  method: string
  setMethod: (method: string) => void
  contract: ContractResponseDto
  setContract: (contract: ContractResponseDto) => void
  ResetContract: () => void
}

interface SupplierOption {
  value: number
  label: string
  data: any
}

export default function CreateEditContractModal({
  isOpen,
  onClose,
  GetContracts,
  method,
  setMethod,
  contract,
  setContract,
  ResetContract
}: CreateEditContractModalProps) {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [dateError, setDateError] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierOption | null>(null)

  // Función para cargar proveedores con búsqueda
  const loadSuppliers = useCallback(
    async (inputValue: string): Promise<SupplierOption[]> => {
      try {
        const response = await axios.get(
          `/api/suppliers?searchTerm=${encodeURIComponent(inputValue)}&startIndex=0&endIndex=20`
        )
        const suppliers = response.data.suppliers || []

        return suppliers.map((supplier: any) => ({
          value: supplier.id,
          label: supplier.name,
          data: supplier
        }))
      } catch (error) {
        console.error('Error loading suppliers:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los proveedores',
          status: 'error',
          duration: 3000,
          isClosable: true
        })
        return []
      }
    },
    [toast]
  )

  // Función para formatear a COP
  const formatToCOP = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Función para parsear desde COP a número
  const parseFromCOP = (value: string): number => {
    const numericValue = value.replace(/[^\d]/g, '')
    return parseFloat(numericValue) || 0
  }

  const handleSupplierChange = (selectedOption: SupplierOption | null) => {
    setSelectedSupplier(selectedOption)

    if (selectedOption) {
      setContract({
        ...contract,
        supplierId: selectedOption.value,
        supplier: {
          id: selectedOption.value,
          name: selectedOption.label
        }
      })
    } else {
      setContract({
        ...contract,
        supplierId: 0,
        supplier: {
          id: 0,
          name: ''
        }
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === 'Amount' && method === 'crear') {
      // Solo permitir cambiar monto en creación
      const numericValue = parseFromCOP(value)
      setContract({
        ...contract,
        amount: numericValue
      })
      setAmountInput(value) // Guardar el valor formateado
    } else if (name !== 'Amount') {
      // Ignorar cambios en monto en edición
      const fieldMap: { [key: string]: string } = {
        'Description': 'description'
      }
      const fieldName = fieldMap[name] || name.toLowerCase()
      setContract({
        ...contract,
        [fieldName]: value
      })
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newDate = new Date(value)

    const dateFieldMap: { [key: string]: string } = {
      'StartDate': 'startDate',
      'EndDate': 'endDate'
    }
    const fieldName = dateFieldMap[name] || name.toLowerCase()

    setContract({
      ...contract,
      [fieldName]: newDate
    })

    // Validar fechas
    if (name === 'StartDate' && contract.endDate && newDate >= new Date(contract.endDate)) {
      setDateError('La fecha de inicio debe ser anterior a la fecha de fin')
    } else if (name === 'EndDate' && contract.startDate && newDate <= new Date(contract.startDate)) {
      setDateError('La fecha de fin debe ser posterior a la fecha de inicio')
    } else {
      setDateError('')
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Validación de campos requeridos
      if (!contract.startDate || !contract.endDate || !contract.amount || !contract.supplierId) {
        toast({
          title: 'Error',
          description: 'Por favor complete todos los campos requeridos',
          status: 'error',
          duration: 5000,
          isClosable: true
        })
        setIsLoading(false)
        return
      }

      // Validación de fechas
      if (new Date(contract.startDate) >= new Date(contract.endDate)) {
        toast({
          title: 'Error',
          description: 'La fecha de fin debe ser posterior a la fecha de inicio',
          status: 'error',
          duration: 5000,
          isClosable: true
        })
        setIsLoading(false)
        return
      }

      if (method === 'crear') {
        // Transformar a formato PascalCase para el API
        const contractData = {
          StartDate: contract.startDate,
          EndDate: contract.endDate,
          Amount: contract.amount,
          Description: contract.description,
          IdSuppliers: contract.supplierId
        }
        await axios.post('/api/contracts', contractData)
        toast({
          title: 'Contrato creado',
          description: 'El contrato ha sido creado exitosamente',
          status: 'success',
          duration: 5000,
          isClosable: true
        })
      } else {
        // Transformar a formato PascalCase para el API
        const contractData = {
          Id: contract.id,
          StartDate: contract.startDate,
          EndDate: contract.endDate,
          Amount: contract.amount,
          Description: contract.description,
          IdSuppliers: contract.supplierId
        }
        await axios.put('/api/contracts', contractData)
        toast({
          title: 'Contrato actualizado',
          description: 'El contrato ha sido actualizado exitosamente',
          status: 'success',
          duration: 5000,
          isClosable: true
        })
      }

      onClose()
      ResetContract()
      GetContracts()
    } catch (error) {
      console.error('Error saving contract:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar el contrato',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateForInput = (date: Date | string) => {
    if (!date) return ''
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toISOString().split('T')[0]
  }

  // Cargar el proveedor seleccionado cuando se abre el modal en modo edición
  useState(() => {
    if (isOpen && method === 'editar' && contract.supplierId && !selectedSupplier) {
      setSelectedSupplier({
        value: contract.supplierId,
        label: contract.supplier?.name || '',
        data: contract.supplier
      })
    }
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='xl'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{method === 'crear' ? 'Crear Contrato' : 'Editar Contrato'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired mb={4}>
            <FormLabel>Proveedor</FormLabel>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadSuppliers}
              value={selectedSupplier}
              onChange={handleSupplierChange}
              placeholder='Buscar proveedor...'
              noOptionsMessage={() => 'No se encontraron proveedores'}
              loadingMessage={() => 'Buscando...'}
              styles={{
                control: base => ({
                  ...base,
                  minHeight: '40px'
                })
              }}
            />
          </FormControl>

          <FormControl isRequired mb={4}>
            <FormLabel>Fecha de Inicio</FormLabel>
            <Input
              type='date'
              name='StartDate'
              value={formatDateForInput(contract.startDate)}
              onChange={handleDateChange}
            />
          </FormControl>

          <FormControl isRequired mb={4}>
            <FormLabel>Fecha de Fin</FormLabel>
            <Input
              type='date'
              name='EndDate'
              value={formatDateForInput(contract.endDate)}
              onChange={handleDateChange}
            />
            {dateError && <span style={{ color: 'red', fontSize: '0.875rem' }}>{dateError}</span>}
          </FormControl>

          <FormControl isRequired mb={4}>
            <FormLabel>Monto</FormLabel>
            <Input
              type='text'
              name='Amount'
              value={method === 'crear' ? amountInput : formatToCOP(contract.amount)}
              onChange={handleChange}
              isDisabled={method !== 'crear'}
              onFocus={() => {
                if (method === 'crear') {
                  setAmountInput(contract.amount.toString())
                }
              }}
              onBlur={() => {
                if (method === 'crear') {
                  setAmountInput(formatToCOP(contract.amount))
                }
              }}
              placeholder='$0'
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Descripción</FormLabel>
            <Textarea name='Description' value={contract.description} onChange={handleChange} />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme='teal' mr={3} onClick={handleSubmit} isLoading={isLoading} isDisabled={!!dateError}>
            {method === 'crear' ? 'Crear' : 'Actualizar'}
          </Button>
          <Button variant='ghost' onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
