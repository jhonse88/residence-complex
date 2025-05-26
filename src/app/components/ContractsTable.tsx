/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
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
} from "@chakra-ui/react";
import { HiTrash, HiPencil, HiPlus } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CreateEditContractModal from "./ContractsComponents/CreateEditContractModal";
import DeleteContractModal from "./ContractsComponents/DeleteContractModal";
import Pagination from "./ContractsComponents/Pagination";
import { formatearFecha } from "@/app/utils/dateUtils";
import PaymentModal from "./ContractsComponents/PaymentModal";
import { MdPayments } from "react-icons/md";

export interface Contract {
  Id: number;
  StartDate: Date | string;
  EndDate: Date | string;
  Amount: number;
  Debt?: number;
  Description: string;
  IdSuppliers: number;
  Suppliers: {
    Id: number;
    Name: string;
  };
}

export default function ContractsTable() {
  const { status } = useSession();
  const { replace } = useRouter();
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

  const {
    isOpen: isOpenModalPay,
    onOpen: onOpenModalPay,
    onClose: onCloseModalPay,
  } = useDisclosure();

  const [isLoading] = useState(false);

  // Estados para Create And Edit Modal
  const [method, setMethod] = useState<string>("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contract, setContract] = useState<Contract>({
    Id: 0,
    StartDate: new Date(),
    EndDate: new Date(),
    Amount: 0,
    Description: "",
    IdSuppliers: 0,
    Suppliers: {
      Id: 0,
      Name: "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const contractsPerPage = 7;
  const [firstIndex, setFirstIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(contractsPerPage);
  const [searchTerm, setSearchTerm] = useState("");

  const GetContracts = async (startIndex: number = 0, endIndex: number = 7) => {
    try {
      const res = await axios.get("/api/contracts", {
        params: { skip: startIndex, take: endIndex - startIndex },
      });

      if (res.data && Array.isArray(res.data.contracts)) {
        setContracts(res.data.contracts);
      } else {
        console.error("Formato de datos inesperado:", res.data);
        setContracts([]);
      }

      setFirstIndex(startIndex);
      setLastIndex(endIndex);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      setContracts([]);
    }
  };

  const GetSuppliers = async () => {
    try {
      const res = await axios.get("/api/suppliers");
      if (res.data && Array.isArray(res.data.suppliers)) {
        setSuppliers(res.data.suppliers);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const EditContract = async (contractId: number) => {
    setMethod("editar");
    const contractFound = contracts.find((c) => c.Id === contractId);
    if (contractFound) {
      setContract({
        ...contractFound,
        StartDate: new Date(contractFound.StartDate),
        EndDate: new Date(contractFound.EndDate),
      });
      onOpenModalCreateEdit();
    }
  };

  const ResetContract = () => {
    setContract({
      Id: 0,
      StartDate: new Date(),
      EndDate: new Date(),
      Amount: 0,
      Debt: 0, // Nuevo campo
      Description: "",
      IdSuppliers: 0,
      Suppliers: {
        Id: 0,
        Name: "",
      },
    });
  };

  // Delete Contract Modal
  const [contractIdToDelete, setContractIdToDelete] = useState<number>(0);

  const handleOpenModalAndDeleteConfirmation = (contractId: number) => {
    setContractIdToDelete(contractId);
    onOpenModalDelete();
  };

  const handleOpenModalPay = (contractId: number) => {
    setContractIdToDelete(contractId);
    onOpenModalPay();
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

  return (
    <>
      <Box px={10}>
        <Box pb={10}>
          <Text fontSize="4xl" textAlign={"center"}>
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
          <Table variant="striped" colorScheme="teal">
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
                contracts.map((contract: Contract) => (
                  <Tr key={contract.Id}>
                    <Td>{contract.Id}</Td>
                    <Td>{contract.Suppliers?.Name || "N/A"}</Td>
                    <Td>
                      {
                        ///@ts-ignore
                        formatDate(contract.StartDate)
                      }
                    </Td>
                    <Td>
                      {
                        ///@ts-ignore
                        formatDate(contract.EndDate)
                      }
                    </Td>
                    <Td>${contract.Amount.toLocaleString()}</Td>
                    <Td>${contract?.Debt?.toLocaleString()}</Td> 
                    <Td>{contract.Description || "-"}</Td>
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
                          border="none"
                          bg="transparent"
                          onClick={() =>
                            handleOpenModalAndDeleteConfirmation(contract.Id)
                          }
                        />
                        <IconButton
                          variant="ghost"
                          colorScheme="teal"
                          aria-label="Editar"
                          fontSize="20px"
                          icon={<HiPencil />}
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                          border="none"
                          bg="transparent"
                          onClick={() => EditContract(contract.Id)}
                        />

                        <IconButton
                          variant="ghost"
                          colorScheme="green"
                          aria-label="Pay"
                          fontSize="20px"
                          icon={<MdPayments />}
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                          border="none"
                          bg="transparent"
                          onClick={() => handleOpenModalPay(contract.Id)}
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
        suppliers={suppliers}
      />

      <PaymentModal
        isOpen={isOpenModalPay}
        onClose={() => onCloseModalPay()}
        contractId={contractIdToDelete}
        contractNumber={contractIdToDelete.toString()}
        GetContracts={GetContracts}
      />
    </>
  );
}
