/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Input,
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
  Text,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { HiTrash, HiPencil, HiPlus } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
// import Pagination from "../components/Pagination";
import CreateEditContractModal from "./ContractsComponents/CreateEditContractModal";
import DeleteContractModal from "./ContractsComponents/DeleteContractModal";
import { formatearFecha } from '@/app/utils/dateUtils';

// Definición de interfaces
interface Supplier {
  Id: number;
  Name: string;
  Phone: string;
  Email: string;
  State: boolean;
}

interface Contract {
  Id: number;
  StartDate: Date;
  EndDate: Date;
  Amount: number;
  Description: string;
  Suppliers: {
    Name: string;
  };
  IdSuppliers: number; // Añadimos IdSuppliers aquí
}

// Tipo para el estado del formulario
interface ContractFormState {
  Id?: number;
  StartDate: Date;
  EndDate: Date;
  Amount: number;
  Description: string;
  IdSuppliers: number;
}

export default function ContractsTable() {
  const { status } = useSession();
  const { replace } = useRouter();
  const toast = useToast();
  
  // Modals
  const {
    isOpen: isOpenModalDelete,
    onOpen: onOpenModalDelete,
    onClose: onCloseModalDelete,
  } = useDisclosure();
  
  const {
    isOpen: isOpenModalCreateEdit,
    onOpen: onOpenModalCreateEdit,
    onClose: onCloseModalCreateEdit,
  } = useDisclosure();

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<string>("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contract, setContract] = useState<ContractFormState>({
    StartDate: new Date(),
    EndDate: new Date(),
    Amount: 0,
    Description: "",
    IdSuppliers: 0,
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Pagination
  const contractsPerPage = 7;
  const [firstIndex, setFirstIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(contractsPerPage);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete state
  const [contractIdToDelete, setContractIdToDelete] = useState<number>(0);

  // Fetch data
  const GetContracts = async (startIndex: number = 0, endIndex: number = contractsPerPage) => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/contracts", {
        params: { searchTerm, startIndex, endIndex },
      });

      if (res.data && res.data.contracts) {
        setContracts(res.data.contracts);
      } else {
        setContracts([]);
      }

      setFirstIndex(startIndex);
      setLastIndex(endIndex);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contratos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const GetSuppliers = async () => {
    try {
      const res = await axios.get("/api/suppliers");
      if (res.data) {
        setSuppliers(res.data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const EditContract = (contractId: number) => {
    setMethod("editar");
    const contractFound = contracts.find((c) => c.Id === contractId);
    if (contractFound) {
      setContract({
        Id: contractFound.Id,
        StartDate: new Date(contractFound.StartDate),
        EndDate: new Date(contractFound.EndDate),
        Amount: contractFound.Amount,
        Description: contractFound.Description,
        IdSuppliers: contractFound.IdSuppliers
      });
      onOpenModalCreateEdit();
    }
  };

  const ResetContract = () => {
    setContract({
      StartDate: new Date(),
      EndDate: new Date(),
      Amount: 0,
      Description: "",
      IdSuppliers: 0,
    });
  };

  const handleOpenDeleteModal = (contractId: number) => {
    setContractIdToDelete(contractId);
    onOpenModalDelete();
  };

  useEffect(() => {
    GetContracts();
    GetSuppliers();
  }, [searchTerm]);

  if (status === "unauthenticated") {
    replace("/");
  }

  const formatDate = (date: Date) => {
    return formatearFecha(date);
  };

  const getContractStatus = (endDate: Date) => {
    const today = new Date();
    const end = new Date(endDate);
    return end >= today ? "Vigente" : "Expirado";
  };

  const getStatusColor = (status: string) => {
    return status === "Vigente" ? "green" : "red";
  };

  return (
    <>
      <Box px={10}>
        <Box pb={10}>
          <Text fontSize="4xl" textAlign={"center"}>
            Contratos
          </Text>
          <Input
            placeholder="Buscar contratos"
            variant="filled"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="lg"
          />
        </Box>
        
        <TableContainer>
          <Table variant="striped" colorScheme="teal">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Proveedor</Th>
                <Th>Fecha Inicio</Th>
                <Th>Fecha Fin</Th>
                <Th>Monto</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={7} textAlign="center">
                    <CircularProgress isIndeterminate color="teal.300" />
                  </Td>
                </Tr>
              ) : contracts.length > 0 ? (
                contracts.map((contract: Contract) => (
                  <Tr key={contract.Id}>
                    <Td>{contract.Id}</Td>
                    <Td>{contract.Suppliers?.Name || "N/A"}</Td>
                    <Td>{formatDate(contract.StartDate)}</Td>
                    <Td>{formatDate(contract.EndDate)}</Td>
                    <Td>${contract.Amount.toLocaleString()}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(getContractStatus(contract.EndDate))}>
                        {getContractStatus(contract.EndDate)}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex>
                        <IconButton
                          variant="ghost"
                          colorScheme="red"
                          aria-label="Eliminar"
                          fontSize="20px"
                          icon={<HiTrash />}
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                          onClick={() => handleOpenDeleteModal(contract.Id)}
                        />
                        <IconButton
                          variant="ghost"
                          colorScheme="teal"
                          aria-label="Editar"
                          fontSize="20px"
                          icon={<HiPencil />}
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                          onClick={() => EditContract(contract.Id)}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7} textAlign="center">
                    No se encontraron contratos
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* <Pagination
        GetData={GetContracts}
        searchTerm={searchTerm}
        setData={setContracts}
        firstIndex={firstIndex}
        setFirstIndex={setFirstIndex}
        lastIndex={lastIndex}
        setLastIndex={setLastIndex}
        itemsPerPage={contractsPerPage}
      /> */}

      <Button
        colorScheme="teal"
        width="45px"
        height="45px"
        position="fixed"
        right="2em"
        bottom="1em"
        isDisabled={isLoading}
        onClick={() => {
          onOpenModalCreateEdit();
          setMethod("crear");
          ResetContract();
        }}
      >
        {isLoading ? <CircularProgress size="md" /> : <HiPlus size={25} />}
      </Button>

      <DeleteContractModal
        isOpen={isOpenModalDelete}
        onClose={onCloseModalDelete}
        contractId={contractIdToDelete}
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
        suppliers={suppliers}
      />
    </>
  );
}