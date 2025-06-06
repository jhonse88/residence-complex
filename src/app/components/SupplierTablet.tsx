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
  Icon,
} from "@chakra-ui/react";
import { HiTrash, HiPencil, HiPlus, HiClipboardList } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Pagination from "./SupplierComponents/Pagination";
import { Supplier } from "../types/api";
import CreateEditSupplierModal from "./SupplierComponents/CreateEditSupplierModal";
import DeleteSupplierModal from "./SupplierComponents/DeleteSupplierModal";
import ServiceRequestModal from "./SupplierComponents/ServiceRequestModal";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

export default function SupplierTable() {
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
  const [isLoading] = useState(false);

  // Estados para Create And Edit Modal
  const [method, setMethod] = useState<string>("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier>({
    Id: 0,
    Name: "",
    Phone: "",
    Email: "",
    State: true,
  });

  const supplierPerPage = 7;
  const [firstIndex, setFirstIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(supplierPerPage);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>("");


  const {
    isOpen: isOpenServiceRequestModal,
    onOpen: onOpenServiceRequestModal,
    onClose: onCloseServiceRequestModal,
  } = useDisclosure();

  const GetSuppliers = async (startIndex: number = 0, endIndex: number = 7) => {
    try {
      const res = await axios.get("/api/suppliers", {
        params: { searchTerm, startIndex, endIndex },
      });

      console.log("Datos recibidos:", res.data); // Para depuración

      if (res.data && Array.isArray(res.data)) {
        setSuppliers(res.data);
      } else if (res.data && res.data.suppliers) {
        setSuppliers(res.data.suppliers);
      } else {
        console.error("Formato de datos inesperado:", res.data);
        setSuppliers([]);
      }

      setFirstIndex(startIndex);
      setLastIndex(endIndex);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    }
  };

  const EditSupplier = async (supplierId: number) => {
    setMethod("editar");
    const supplierFound = suppliers.find((s) => s.Id === supplierId);
    if (supplierFound) {
      setSupplier(supplierFound);
      onOpenModalCreateEdit();
    }
  };

  const ResetSupplier = () => {
    setSupplier({
      Id: 0,
      Name: "",
      Phone: "",
      Email: "",
      State: true,
    });
  };

  // Delete Supplier Modal
  const [supplierIdToDelete, setSupplierIdToDelete] = useState("");
  const handleOpenModalAndDeleteConfirmation = (supplierId: string) => {
    setSupplierIdToDelete(supplierId);
    onOpenModalDelete();
  };

  useEffect(() => {
    GetSuppliers();
  }, [searchTerm]);

  if (status === "unauthenticated") {
    replace("/");
  }

  return (
    <>
      <Box px={10}>
        <Box pb={10}>
          <Text fontSize="4xl" textAlign={"center"}>
            {" "}
            Provedores
          </Text>
          <Input
            placeholder="Buscar proveedores"
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
                <Th>Nombre</Th>
                <Th>Teléfono</Th>
                <Th>Correo</Th>
                <Th>Calificación</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {suppliers.length > 0 ? (
                suppliers.map((supplier: Supplier) => (
                  <Tr key={supplier.Id}>
                    <Td>{supplier.Id}</Td>
                    <Td>{supplier.Name}</Td>
                    <Td>{supplier.Phone}</Td>
                    <Td>{supplier.Email || "-"}</Td>
                    <Td>
                      {supplier.averageRating ? (
                        <Flex align="center">
                          <Text mr={2}>
                            {supplier.averageRating.toFixed(1)}/5
                          </Text>
                          <Flex>
                            {[...Array(5)].map((_, i) => {
                              const starValue = i + 1;
                              const rating = supplier.averageRating!;

                              if (rating >= starValue) {
                                return (
                                  <Icon
                                    as={FaStar}
                                    key={i}
                                    color="yellow.400"
                                  />
                                );
                              } else if (rating >= starValue - 0.5) {
                                return (
                                  <Icon
                                    as={FaStarHalfAlt}
                                    key={i}
                                    color="yellow.400"
                                  />
                                );
                              } else {
                                return (
                                  <Icon
                                    as={FaRegStar}
                                    key={i}
                                    color="yellow.400"
                                  />
                                );
                              }
                            })}
                          </Flex>
                        </Flex>
                      ) : (
                        "No calificado"
                      )}
                    </Td>
                    <Td>{supplier.State ? "Activo" : "Inactivo"}</Td>
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
                            handleOpenModalAndDeleteConfirmation(
                              `${supplier.Id}`
                            )
                          }
                          disabled={!supplier.State}
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
                          onClick={() => EditSupplier(supplier.Id)}
                          disabled={!supplier.State}
                        />
                        <IconButton
                          variant="ghost"
                          colorScheme="blue"
                          aria-label="Solicitudes"
                          fontSize="20px"
                          icon={<HiClipboardList />}
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                          border="none"
                          bg="transparent"
                          onClick={() => {
                            setSelectedSupplierId(supplier.Id);
                            setSelectedSupplierName(supplier.Name);
                            onOpenServiceRequestModal();
                            setSupplier(supplier)
                          }}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7} textAlign="center">
                    No se encontraron proveedores
                  </Td>
                  
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Pagination
        GetData={GetSuppliers}
        searchTerm={searchTerm}
        setData={setSuppliers}
        firstIndex={firstIndex}
        setFirstIndex={setFirstIndex}
        lastIndex={lastIndex}
        setLastIndex={setLastIndex}
        itemsPerPage={supplierPerPage}
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
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onOpenModalCreateEdit(), setMethod("crear");
          ResetSupplier();
        }}
      >
        {isLoading ? <CircularProgress size="md" /> : <HiPlus size={25} />}
      </Button>

      <DeleteSupplierModal
        isOpen={isOpenModalDelete}
        onClose={onCloseModalDelete}
        supplierIdToDelete={supplierIdToDelete}
        onDelete={() => GetSuppliers()}
      />

      <CreateEditSupplierModal
        isOpen={isOpenModalCreateEdit}
        onClose={onCloseModalCreateEdit}
        GetSuppliers={GetSuppliers}
        method={method}
        setMethod={setMethod}
        supplier={supplier}
        setSupplier={setSupplier}
        ResetSupplier={ResetSupplier}
        suppliers={suppliers}
      />

      <ServiceRequestModal
        isOpen={isOpenServiceRequestModal}
        onClose={onCloseServiceRequestModal}
        supplierId={selectedSupplierId}
        supplierName={selectedSupplierName}
        GetSuppliers={GetSuppliers} 
        supplier={supplier}
      />
    </>
  );
}
