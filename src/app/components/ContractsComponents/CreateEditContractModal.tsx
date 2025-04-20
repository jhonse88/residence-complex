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
  Select,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";
import { Contract } from "@/app/types/api";

interface CreateEditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  GetContracts: () => void;
  method: string;
  setMethod: (method: string) => void;
  contract: Contract;
  setContract: (contract: Contract) => void;
  ResetContract: () => void;
  suppliers: any[];
}

export default function CreateEditContractModal({
  isOpen,
  onClose,
  GetContracts,
  method,
  setMethod,
  contract,
  setContract,
  ResetContract,
  suppliers,
}: CreateEditContractModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [amountInput, setAmountInput] = useState("");

  // Función para formatear a COP
  const formatToCOP = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Función para parsear desde COP a número
  const parseFromCOP = (value: string): number => {
    const numericValue = value.replace(/[^\d]/g, '');
    return parseFloat(numericValue) || 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "IdSuppliers") {
      const selectedSupplier = suppliers.find((s) => s.Id === parseInt(value));
      setContract({
        ...contract,
        IdSuppliers: parseInt(value),
        Suppliers: {
          Id: selectedSupplier?.Id || 0,
          Name: selectedSupplier?.Name || "",
        },
      });
    } else if (name === "Amount" && method === "crear") {
      // Solo permitir cambiar monto en creación
      const numericValue = parseFromCOP(value);
      setContract({
        ...contract,
        [name]: numericValue,
      });
      setAmountInput(value); // Guardar el valor formateado
    } else if (name !== "Amount") {
      // Ignorar cambios en monto en edición
      setContract({
        ...contract,
        [name]: value,
      });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newDate = new Date(value);

    setContract({
      ...contract,
      [name]: newDate,
    });

    // Validar fechas
    if (
      name === "StartDate" &&
      contract.EndDate &&
      newDate >= new Date(contract.EndDate)
    ) {
      setDateError("La fecha de inicio debe ser anterior a la fecha de fin");
    } else if (
      name === "EndDate" &&
      contract.StartDate &&
      newDate <= new Date(contract.StartDate)
    ) {
      setDateError("La fecha de fin debe ser posterior a la fecha de inicio");
    } else {
      setDateError("");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validación de campos requeridos
      if (
        !contract.StartDate ||
        !contract.EndDate ||
        !contract.Amount ||
        !contract.IdSuppliers
      ) {
        toast({
          title: "Error",
          description: "Por favor complete todos los campos requeridos",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validación de fechas
      if (new Date(contract.StartDate) >= new Date(contract.EndDate)) {
        toast({
          title: "Error",
          description: "La fecha de fin debe ser posterior a la fecha de inicio",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (method === "crear") {
        await axios.post("/api/contracts", contract);
        toast({
          title: "Contrato creado",
          description: "El contrato ha sido creado exitosamente",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        await axios.put("/api/contracts", contract);
        toast({
          title: "Contrato actualizado",
          description: "El contrato ha sido actualizado exitosamente",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }

      onClose();
      ResetContract();
      GetContracts();
    } catch (error) {
      console.error("Error saving contract:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el contrato",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date | string) => {
    if (!date) return "";
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split("T")[0];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {method === "crear" ? "Crear Contrato" : "Editar Contrato"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired mb={4}>
            <FormLabel>Proveedor</FormLabel>
            <Select
              name="IdSuppliers"
              value={contract.IdSuppliers}
              onChange={handleChange}
              placeholder="Seleccione un proveedor"
            >
              {suppliers.map((supplier) => (
                <option key={supplier.Id} value={supplier.Id}>
                  {supplier.Name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired mb={4}>
            <FormLabel>Fecha de Inicio</FormLabel>
            <Input
              type="date"
              name="StartDate"
              value={formatDateForInput(contract.StartDate)}
              onChange={handleDateChange}
            />
          </FormControl>

          <FormControl isRequired mb={4}>
            <FormLabel>Fecha de Fin</FormLabel>
            <Input
              type="date"
              name="EndDate"
              value={formatDateForInput(contract.EndDate)}
              onChange={handleDateChange}
            />
            {dateError && (
              <span style={{ color: "red", fontSize: "0.875rem" }}>
                {dateError}
              </span>
            )}
          </FormControl>

          <FormControl isRequired mb={4}>
            <FormLabel>Monto</FormLabel>
            <Input
              type="text"
              name="Amount"
              value={method === "crear" 
                ? amountInput 
                : formatToCOP(contract.Amount)}
              onChange={handleChange}
              isDisabled={method !== "crear"}
              onFocus={() => {
                if (method === "crear") {
                  setAmountInput(contract.Amount.toString());
                }
              }}
              onBlur={() => {
                if (method === "crear") {
                  setAmountInput(formatToCOP(contract.Amount));
                }
              }}
              placeholder="$0"
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Descripción</FormLabel>
            <Textarea
              name="Description"
              value={contract.Description}
              onChange={handleChange}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            isLoading={isLoading}
            isDisabled={!!dateError}
          >
            {method === "crear" ? "Crear" : "Actualizar"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}