'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Button,
  CircularProgress,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  Box,
  Flex,
  IconButton,
  Text
} from '@chakra-ui/react'
import { HiTrash, HiPencil, HiPlus } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import CreateEditContractModal from './ContractsComponents/CreateEditContractModal'
import DeleteContractModal from './ContractsComponents/DeleteContractModal'
import Pagination from './ContractsComponents/Pagination'
import { formatearFecha } from '../../shared/utils/dateUtils'
import PaymentModal from './ContractsComponents/PaymentModal'
import { MdPayments } from 'react-icons/md'
import { ContractResponseDto } from '../../application/dto/ContractDto'

export default function ContractsTable() {
  const { status } = useSession()
  const { replace } = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Evitar hidratación inconsistente
  useEffect(() => {
    setIsClient(true)
  }, [])
  const { isOpen: isOpenModalDelete, onOpen: onOpenModalDelete, onClose: onCloseModalDelete } = useDisclosure()
  const {
    isOpen: isOpenModalCreateEdit,
    onOpen: onOpenModalCreateEdit,
    onClose: onCloseModalCreateEdit
  } = useDisclosure()

  const { isOpen: isOpenModalPay, onOpen: onOpenModalPay, onClose: onCloseModalPay } = useDisclosure()

  const [isLoading] = useState(false)

  // Estados para Create And Edit Modal
  const [method, setMethod] = useState<string>('')
  const [contracts, setContracts] = useState<ContractResponseDto[]>([])
  const [contract, setContract] = useState<ContractResponseDto>({
    id: 0,
    startDate: new Date(),
    endDate: new Date(),
    amount: 0,
    debt: 0,
    description: '',
    supplierId: 0,
    supplier: {
      id: 0,
      name: ''
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suppliers, setSuppliers] = useState<any[]>([])

  const contractsPerPage = 7
  const [firstIndex, setFirstIndex] = useState(0)
  const [lastIndex, setLastIndex] = useState(contractsPerPage)
  const [searchTerm, setSearchTerm] = useState('')

  const GetContracts = async (startIndex: number = 0, endIndex: number = 7) => {
    try {
      const res = await axios.get('/api/contracts', {
        params: { skip: startIndex, take: endIndex - startIndex }
      })

      if (res.data && Array.isArray(res.data.contracts)) {
        setContracts(res.data.contracts)
      } else {
        console.error('Formato de datos inesperado:', res.data)
        setContracts([])
      }

      setFirstIndex(startIndex)
      setLastIndex(endIndex)
    } catch (error) {
      console.error('Error fetching contracts:', error)
      setContracts([])
    }
  }

  const GetSuppliers = async () => {
    try {
      const res = await axios.get('/api/suppliers')
      if (res.data && Array.isArray(res.data.suppliers)) {
        setSuppliers(res.data.suppliers)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const EditContract = async (contractId: number) => {
    setMethod('editar')
    const contractFound = contracts.find(c => c.id === contractId)
    if (contractFound) {
      setContract({
        ...contractFound,
        startDate: new Date(contractFound.startDate),
        endDate: new Date(contractFound.endDate)
      })
      onOpenModalCreateEdit()
    }
  }

  const ResetContract = () => {
    setContract({
      id: 0,
      startDate: new Date(),
      endDate: new Date(),
      amount: 0,
      debt: 0,
      description: '',
      supplierId: 0,
      supplier: {
        id: 0,
        name: ''
      }
    })
  }

  // Delete Contract Modal
  const [contractIdToDelete, setContractIdToDelete] = useState<number>(0)

  const handleOpenModalAndDeleteConfirmation = (contractId: number) => {
    setContractIdToDelete(contractId)
    onOpenModalDelete()
  }

  const handleOpenModalPay = (contractId: number) => {
    setContractIdToDelete(contractId)
    onOpenModalPay()
  }

  useEffect(() => {
    GetContracts()
    GetSuppliers()
  }, [searchTerm])

  // Mostrar loading mientras se hidrata
  if (!isClient) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <CircularProgress />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    replace('/')
  }

  const formatDate = (date: Date | string) => {
    return formatearFecha(date)
  }

  const formatContractDate = (date: Date | string) => {
    if (!date) return '-'
    
    // Si es una string ISO, extraer la fecha directamente para evitar problemas de zona horaria
    if (typeof date === 'string' && date.includes('T')) {
      const datePart = date.split('T')[0] // Obtener solo la parte de la fecha (YYYY-MM-DD)
      const [year, month, day] = datePart.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Si es un objeto Date, usar el método normal
    const dateObj = date instanceof Date ? date : new Date(date)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    
    return `${day}/${month}/${year}`
  }

  return (
    <>
      <Box px={10}>
        <Box pb={10}>
          <Text fontSize='4xl' textAlign={'center'}>
            Contratos
          </Text>
          {/* <Input
            placeholder="Buscar contratos"
            variant="filled"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="lg"
          /> */}
        </Box>
        <TableContainer>
          <Table variant='striped' colorScheme='teal'>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Proveedor</Th>
                <Th>Fecha Inicio</Th>
                <Th>Fecha Fin</Th>
                <Th>Monto</Th>
                <Th>Deuda</Th>
                <Th>Descripción</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {contracts.length > 0 ? (
                contracts.map((contract: ContractResponseDto) => (
                  <Tr key={contract.id}>
                    <Td>{contract.id}</Td>
                    <Td>{contract.supplier?.name || 'N/A'}</Td>
                    <Td>
                      {formatContractDate(contract.startDate)}
                    </Td>
                    <Td>
                      {formatContractDate(contract.endDate)}
                    </Td>
                    <Td>${contract.amount.toLocaleString()}</Td>
                    <Td>${contract?.debt?.toLocaleString()}</Td>
                    <Td>{contract.description || '-'}</Td>
                    <Td>
                      <Flex>
                        <IconButton
                          variant='ghost'
                          colorScheme='red'
                          aria-label='Eliminar'
                          fontSize='20px'
                          icon={<HiTrash />}
                          _hover={{ bg: 'transparent' }}
                          _active={{ bg: 'transparent' }}
                          border='none'
                          bg='transparent'
                          onClick={() => handleOpenModalAndDeleteConfirmation(contract.id)}
                        />
                        <IconButton
                          variant='ghost'
                          colorScheme='teal'
                          aria-label='Editar'
                          fontSize='20px'
                          icon={<HiPencil />}
                          _hover={{ bg: 'transparent' }}
                          _active={{ bg: 'transparent' }}
                          border='none'
                          bg='transparent'
                          onClick={() => EditContract(contract.id)}
                        />

                        <IconButton
                          variant='ghost'
                          colorScheme='green'
                          aria-label='Pay'
                          fontSize='20px'
                          icon={<MdPayments />}
                          _hover={{ bg: 'transparent' }}
                          _active={{ bg: 'transparent' }}
                          border='none'
                          bg='transparent'
                          onClick={() => handleOpenModalPay(contract.id)}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr key="no-contracts">
                  <Td colSpan={8} textAlign='center'>
                    No se encontraron contratos
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Pagination
        GetData={(start, end) => GetContracts(start, end)}
        searchTerm={searchTerm}
        setData={setContracts}
        firstIndex={firstIndex}
        setFirstIndex={setFirstIndex}
        lastIndex={lastIndex}
        setLastIndex={setLastIndex}
        itemsPerPage={contractsPerPage}
      />

      <Button
        colorScheme='teal'
        width='45px'
        height='45px'
        position='fixed'
        right='2em'
        bottom='1em'
        isDisabled={isLoading}
        onClick={() => {
          onOpenModalCreateEdit()
          setMethod('crear')
          ResetContract()
        }}>
        {isLoading ? <CircularProgress size='md' /> : <HiPlus size={25} />}
      </Button>

      <DeleteContractModal
        isOpen={isOpenModalDelete}
        onClose={onCloseModalDelete}
        contractIdToDelete={contractIdToDelete}
        onDelete={() => GetContracts()}
      />

      <CreateEditContractModal
        isOpen={isOpenModalCreateEdit}
        onClose={onCloseModalCreateEdit}
        GetContracts={GetContracts}
        method={method}
        setMethod={setMethod}
        contract={contract}
        setContract={setContract}
        ResetContract={ResetContract}
      />

      <PaymentModal
        isOpen={isOpenModalPay}
        onClose={() => onCloseModalPay()}
        contractId={contractIdToDelete}
        contractNumber={contractIdToDelete.toString()}
        GetContracts={GetContracts}
      />
    </>
  )
}
