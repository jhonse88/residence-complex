/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  useToast,
  Flex,
  Text,
  Select,
  InputGroup,
  InputLeftAddon,
  Image,
  Box
} from '@chakra-ui/react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { MdPayment } from 'react-icons/md'
import { useState, useEffect, ChangeEvent, useCallback } from 'react'
import axios from 'axios'
import Joi from 'joi'

interface Payment {
  Id: number
  PaymentDate: string
  Amount: number
  PaymentMethod: string
  IdContracts: number
  Contracts?: {
    ContractNumber: string
    Debt?: number
    Suppliers?: {
      Phone?: string
    }
  }
}

interface PaymentNavigation {
  hasNext: boolean
  hasPrev: boolean
}

const PaymentModal = ({
  isOpen,
  onClose,
  contractId,
  contractNumber,
  GetContracts
}: {
  isOpen: boolean
  onClose: () => void
  contractId: number
  contractNumber: string
  GetContracts: () => void
}) => {
  const toast = useToast()
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [navigation, setNavigation] = useState<PaymentNavigation>({ hasNext: false, hasPrev: false })
  const [contractDebt, setContractDebt] = useState<number>(0)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [nequiLink, setNequiLink] = useState('')
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: '',
    amount: 0
  })

  const paymentMethods = [
    'Efectivo',
    'Transferencia Bancaria',
    'Tarjeta de Crédito',
    'Tarjeta de Débito',
    'Cheque',
    'Otro'
  ]

  const paymentSchema = Joi.object({
    PaymentDate: Joi.date().iso().required().messages({
      'date.base': 'La fecha y hora deben ser válidas',
      'date.iso': 'El formato de fecha y hora debe ser ISO válido',
      'any.required': 'La fecha y hora son obligatorias'
    }),
    Amount: Joi.number()
      .required()
      .min(1)
      .max(contractDebt)
      .messages({
        'number.base': 'El monto debe ser un número válido',
        'number.min': 'El monto debe ser mayor a $0',
        'number.max': `⚠️ El monto no puede superar la deuda disponible de $${contractDebt.toLocaleString()}. Solo puedes pagar hasta el monto adeudado.`,
        'any.required': 'El monto es obligatorio'
      }),
    PaymentMethod: Joi.string().required().messages({
      'string.empty': 'El método de pago es obligatorio'
    }),
    IdContracts: Joi.number().required()
  })

  // Memoizar funciones para evitar recreaciones innecesarias
  const formatToDatetimeLocal = useCallback((isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }, [])

  const parseDatetimeLocal = useCallback((datetimeLocal: string) => {
    if (!datetimeLocal) return ''
    return new Date(datetimeLocal).toISOString()
  }, [])

  const validateForm = useCallback(() => {
    if (!currentPayment) return false

    const { error } = paymentSchema.validate(currentPayment, {
      abortEarly: false,
      allowUnknown: true
    })

    if (error) {
      const newErrors = error.details.reduce((acc: any, curr: any) => {
        acc[curr.path[0]] = curr.message
        return acc
      }, {})
      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }, [currentPayment, paymentSchema])

  // Función optimizada para obtener información de navegación
  const checkPaymentNavigation = useCallback(
    async (paymentId: number) => {
      try {
        const [nextRes, prevRes] = await Promise.all([
          axios.get('/api/payments', {
            params: { contractId, currentId: paymentId, direction: 'next' }
          }),
          axios.get('/api/payments', {
            params: { contractId, currentId: paymentId, direction: 'prev' }
          })
        ])

        setNavigation({
          hasNext: !!nextRes.data,
          hasPrev: !!prevRes.data
        })
      } catch (error) {
        setNavigation({ hasNext: false, hasPrev: false })
      }
    },
    [contractId]
  )

  // Función optimizada para cargar datos
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Cargar deuda del contrato y último pago en paralelo
      const [contractResponse, lastPaymentResponse] = await Promise.all([
        axios.get(`/api/contracts/${contractId}`),
        axios.get('/api/payments', { params: { contractId, direction: 'last' } })
      ])

      setContractDebt(contractResponse.data.Debt || 0)

      if (lastPaymentResponse.data?.Id) {
        setCurrentPayment(lastPaymentResponse.data)
        // Verificar navegación solo si hay un pago válido
        await checkPaymentNavigation(lastPaymentResponse.data.Id)
      } else {
        setCurrentPayment(null)
        setNavigation({ hasNext: false, hasPrev: false })
      }

      setIsCreating(false)
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast({
        position: 'top',
        title: 'Error',
        description: 'No se pudo cargar la información',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }, [contractId, checkPaymentNavigation, toast])

  const fetchPayment = useCallback(
    async (direction?: 'next' | 'prev' | 'last') => {
      try {
        setIsLoading(true)
        const params = {
          contractId,
          ...(currentPayment?.Id && { currentId: currentPayment.Id }),
          ...(direction && { direction })
        }

        const response = await axios.get('/api/payments', { params })

        if (response.data?.Id) {
          setCurrentPayment(response.data)
          await checkPaymentNavigation(response.data.Id)
        } else {
          setCurrentPayment(null)
          setNavigation({ hasNext: false, hasPrev: false })
        }

        setIsCreating(false)
      } catch (error) {
        console.error('Error fetching payment:', error)
        toast({
          position: 'top',
          title: 'Error',
          description: 'No se pudo cargar el pago',
          status: 'error',
          duration: 3000,
          isClosable: true
        })
      } finally {
        setIsLoading(false)
      }
    },
    [contractId, currentPayment?.Id, checkPaymentNavigation, toast]
  )

  const createNewPayment = useCallback(() => {
    setCurrentPayment({
      Id: 0,
      PaymentDate: new Date().toISOString(),
      Amount: 0,
      PaymentMethod: '',
      IdContracts: contractId
    })
    setIsCreating(true)
    setNavigation({ hasNext: false, hasPrev: false })
  }, [contractId])

  const generateQRForPayment = useCallback(async () => {
    if (!currentPayment?.Amount) {
      toast({
        position: 'top',
        title: 'Error',
        description: 'El monto del pago no es válido',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await axios.post('/api/payments/generate-qr', {
        contractId,
        amount: currentPayment.Amount
      })

      setQrCode(response.data.qrCode)
      setNequiLink(response.data.nequiLink)
      setPaymentDetails({
        phoneNumber: response.data.phoneNumber,
        amount: response.data.amount
      })
      setShowQRModal(true)
    } catch (error) {
      toast({
        position: 'top',
        title: 'Error',
        description: 'No se pudo generar el código QR',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPayment?.Amount, contractId, toast])

  const savePayment = useCallback(async () => {
    if (!currentPayment) return

    // Validación específica para monto excesivo
    if (currentPayment.Amount > contractDebt) {
      toast({
        position: 'top',
        title: '⚠️ Monto Excesivo',
        description: `No puedes pagar $${currentPayment.Amount.toLocaleString()} cuando la deuda es de $${contractDebt.toLocaleString()}. El pago máximo permitido es $${contractDebt.toLocaleString()}.`,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
      return
    }

    if (!validateForm()) {
      toast({
        position: 'top',
        title: 'Error de Validación',
        description: 'Por favor, corrija los errores en el formulario antes de continuar.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    try {
      setIsLoading(true)
      const url = '/api/payments'
      const response = currentPayment.Id ? await axios.put(url, currentPayment) : await axios.post(url, currentPayment)

      toast({
        position: 'top',
        description: 'Pago guardado exitosamente.',
        status: 'success',
        duration: 2000,
        isClosable: true
      })

      GetContracts()
      await loadInitialData() // Recargar datos en lugar de fetch individual
    } catch (error) {
      toast({
        position: 'top',
        title: 'Error',
        description: 'Ocurrió un error al guardar el pago',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPayment, validateForm, GetContracts, loadInitialData, toast])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!currentPayment || currentPayment.Id !== 0) return

      const { name, value } = e.target

      setCurrentPayment(prev => ({
        ...prev!,
        [name]: name === 'PaymentDate' ? parseDatetimeLocal(value) : name === 'Amount' ? Number(value) : value
      }))

      // Limpiar errores cuando el usuario está escribiendo
      if (name === 'Amount' && errors.Amount) {
        setErrors((prev: Record<string, string>) => ({ ...prev, Amount: undefined }))
      }
    },
    [currentPayment, parseDatetimeLocal, errors.Amount]
  )

  // Efecto optimizado para cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      setErrors({})
    }
  }, [isOpen, loadInitialData])

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setCurrentPayment(null)
      setNavigation({ hasNext: false, hasPrev: false })
      setErrors({})
      setShowQRModal(false)
    }
  }, [isOpen])

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size='xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex direction='column'>
              <Text fontSize='xl'>Registro de Pago</Text>
              <Text fontSize='sm' color='gray.500'>
                Contrato: {contractNumber}
              </Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoading ? (
              <Flex justify='center' align='center' minH='200px'>
                <Text>Cargando...</Text>
              </Flex>
            ) : contractDebt <= 0 ? (
              // Mostrar mensaje cuando la deuda está pagada
              <Flex direction='column' align='center' justify='center' minH='200px' gap={4}>
                <Text fontSize='xl' color='green.600' fontWeight='bold'>
                  ✅ Contrato Completamente Pagado
                </Text>
                <Text fontSize='md' color='gray.600' textAlign='center'>
                  Este contrato ya ha sido pagado en su totalidad.
                </Text>
                <Text fontSize='sm' color='gray.500' textAlign='center'>
                  No se pueden registrar nuevos pagos para este contrato.
                </Text>
                <Box 
                  bg='green.50' 
                  p={4} 
                  borderRadius='md' 
                  border='1px' 
                  borderColor='green.200'
                  w='full'
                  maxW='400px'
                >
                  <Text fontSize='sm' color='green.700' textAlign='center'>
                    💰 Deuda restante: $0
                  </Text>
                </Box>
              </Flex>
            ) : (
              <>
                <Flex justify='flex-start' mb={4}>
                  <Button 
                    colorScheme='teal' 
                    onClick={createNewPayment} 
                    isDisabled={isLoading} 
                    size='sm'
                  >
                    Nuevo Pago
                  </Button>
                </Flex>

                <SimpleGrid columns={1} spacingY={4}>
                  <FormControl isInvalid={!!errors.PaymentDate} isRequired>
                    <FormLabel fontSize='sm'>Fecha y Hora</FormLabel>
                    <Input
                      name='PaymentDate'
                      value={currentPayment?.PaymentDate ? formatToDatetimeLocal(currentPayment.PaymentDate) : ''}
                      onChange={handleChange}
                      type='datetime-local'
                      size='sm'
                      isReadOnly={currentPayment?.Id !== 0}
                    />
                    <FormErrorMessage fontSize='xs'>{errors.PaymentDate}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.Amount} isRequired>
                    <FormLabel fontSize='sm'>Monto del Pago</FormLabel>
                    <InputGroup size='sm'>
                      <InputLeftAddon>$</InputLeftAddon>
                      <Input
                        name='Amount'
                        type='number'
                        value={currentPayment?.Amount || ''}
                        onChange={handleChange}
                        size='sm'
                        isReadOnly={currentPayment?.Id !== 0}
                        max={contractDebt}
                        placeholder={`Máximo: $${contractDebt.toLocaleString()}`}
                      />
                    </InputGroup>
                    <Flex justify='space-between' mt={1}>
                      <FormErrorMessage fontSize='xs'>{errors.Amount}</FormErrorMessage>
                      <Text 
                        fontSize='xs' 
                        color={currentPayment?.Amount && currentPayment.Amount > contractDebt ? 'red.500' : 'gray.500'}
                        fontWeight={currentPayment?.Amount && currentPayment.Amount > contractDebt ? 'bold' : 'normal'}
                      >
                        {currentPayment?.Amount && currentPayment.Amount > contractDebt 
                          ? `⚠️ Excede la deuda por $${(currentPayment.Amount - contractDebt).toLocaleString()}`
                          : `Deuda disponible: $${contractDebt.toLocaleString()}`
                        }
                      </Text>
                    </Flex>
                  </FormControl>

                  <FormControl isInvalid={!!errors.PaymentMethod} isRequired>
                    <FormLabel fontSize='sm'>Método de Pago</FormLabel>
                    <Select
                      name='PaymentMethod'
                      value={currentPayment?.PaymentMethod || ''}
                      onChange={handleChange}
                      placeholder='Seleccione método'
                      size='sm'
                      isReadOnly={currentPayment?.Id !== 0}>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage fontSize='xs'>{errors.PaymentMethod}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                {currentPayment?.Id ? (
                  <Flex justify='space-between' mt={6}>
                    <Button
                      leftIcon={<HiChevronLeft />}
                      onClick={() => fetchPayment('prev')}
                      isDisabled={!navigation.hasPrev || isLoading}
                      size='sm'
                      variant='outline'>
                      Anterior
                    </Button>
                    <Button
                      colorScheme='green'
                      onClick={generateQRForPayment}
                      isDisabled={isLoading}
                      size='sm'
                      leftIcon={<MdPayment />}>
                      Pagar con Nequi
                    </Button>
                    <Button
                      rightIcon={<HiChevronRight />}
                      onClick={() => fetchPayment('next')}
                      isDisabled={!navigation.hasNext || isLoading}
                      size='sm'
                      variant='outline'>
                      Siguiente
                    </Button>
                  </Flex>
                ) : null}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3} size='sm' variant='ghost'>
              Cerrar
            </Button>
            {contractDebt > 0 && (
              <Button
                colorScheme='teal'
                onClick={savePayment}
                isLoading={isLoading}
                isDisabled={!currentPayment || currentPayment?.Id !== 0}
                size='sm'>
                Guardar Pago
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para el código QR */}
      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} isCentered size='md'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader textAlign='center'>Pagar con Nequi</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction='column' align='center' gap={4}>
              <Box border='1px' borderColor='gray.200' p={2} borderRadius='md'>
                {qrCode && <Image src={qrCode} alt='Código QR para pago Nequi' boxSize='250px' />}
              </Box>

              <Flex direction='column' align='center' mt={2}>
                <Text fontSize='sm' color='gray.600'>
                  Teléfono: {paymentDetails.phoneNumber}
                </Text>
                <Text fontSize='xl' fontWeight='bold' color='green.600'>
                  ${paymentDetails.amount}
                </Text>
              </Flex>

              <Button
                colorScheme='blue'
                as='a'
                href={nequiLink}
                target='_blank'
                leftIcon={<MdPayment />}
                size='lg'
                w='full'
                mt={4}>
                Abrir en App Nequi
              </Button>
            </Flex>
          </ModalBody>
          <ModalFooter justifyContent='center'>
            <Button onClick={() => setShowQRModal(false)} variant='outline'>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default PaymentModal
