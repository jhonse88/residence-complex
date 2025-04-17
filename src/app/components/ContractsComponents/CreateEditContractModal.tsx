/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    Select,
  } from "@chakra-ui/react";
  import axios from "axios";
  import { ChangeEvent, FC, SyntheticEvent, useEffect, useState } from "react";
  import React from "react";
  import Joi from "joi";
  import { Contracts, Suppliers } from "@prisma/client";
  
  interface Props {
    isOpen: boolean;
    onClose: () => void;
    GetContracts: () => void;
    method: string;
    setMethod: React.Dispatch<React.SetStateAction<string>>;
    contract: Partial<Contracts>;
    setContract: any;
    ResetContract: () => void;
    suppliers: Suppliers[];
  }
  
  const CreateEditContractModal: FC<Props> = ({
    isOpen,
    onClose,
    GetContracts,
    method,
    setMethod,
    contract,
    setContract,
    ResetContract,
    suppliers,
  }) => {
    const titleText = method === "crear" ? `Crear Contrato` : `Editar Contrato`;
    const toast = useToast();
    const [errors, setErrors] = useState<any>({});
  
    // Esquema de validación
    const contractSchema = Joi.object({
      StartDate: Joi.date().required().messages({
        "date.base": "La fecha de inicio es obligatoria",
        "any.required": "La fecha de inicio es obligatoria",
      }),
      EndDate: Joi.date()
        .greater(Joi.ref("StartDate"))
        .required()
        .messages({
          "date.base": "La fecha de fin es obligatoria",
          "date.greater": "La fecha de fin debe ser posterior a la fecha de inicio",
          "any.required": "La fecha de fin es obligatoria",
        }),
      Amount: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          "number.base": "El monto debe ser un número",
          "number.integer": "El monto debe ser un número entero",
          "number.min": "El monto debe ser mayor a 0",
          "any.required": "El monto es obligatorio",
        }),
      Description: Joi.string()
        .max(256)
        .allow("")
        .messages({
          "string.max": "La descripción no puede exceder los 256 caracteres",
        }),
      IdSuppliers: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          "number.base": "Debe seleccionar un proveedor",
          "number.min": "Debe seleccionar un proveedor",
          "any.required": "Debe seleccionar un proveedor",
        }),
    });
  
    const validateForm = () => {
      const validationData = {
        StartDate: contract.StartDate,
        EndDate: contract.EndDate,
        Amount: contract.Amount,
        Description: contract.Description,
        IdSuppliers: contract.IdSuppliers,
      };
  
      const { error } = contractSchema.validate(validationData, {
        abortEarly: false,
        allowUnknown: true,
      });
  
      if (error) {
        const newErrors = error.details.reduce((acc: any, curr: any) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
        setErrors(newErrors);
        return false;
      }
      setErrors({});
      return true;
    };
  
    const addContract = async (e: SyntheticEvent) => {
      e.preventDefault();
  
      if (!validateForm()) {
        toast({
          position: "top",
          title: "Error",
          description: "Por favor, corrija los errores en el formulario.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      try {
        const resp = await axios.post("/api/contracts", {
          StartDate: contract.StartDate,
          EndDate: contract.EndDate,
          Amount: contract.Amount,
          Description: contract.Description,
          IdSuppliers: contract.IdSuppliers,
        });
  
        if (resp.data) {
          toast({
            position: "top",
            description: "Contrato creado exitosamente.",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
          GetContracts();
          ResetContract();
          onClose();
        }
      } catch (error) {
        toast({
          position: "top",
          title: "Error",
          description: "Ocurrió un error al crear el contrato",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
  
    const updateContract = async (e: SyntheticEvent) => {
      e.preventDefault();
  
      if (!validateForm()) {
        toast({
          position: "top",
          title: "Error",
          description: "Por favor, corrija los errores en el formulario.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const resp = await axios.put("/api/contracts", {
        Id: contract.Id,
        StartDate: contract.StartDate,
        EndDate: contract.EndDate,
        Amount: contract.Amount,
        Description: contract.Description,
        IdSuppliers: contract.IdSuppliers,
      });
      
      if (resp && resp.data) {
        toast({
          position: "top",
          description: "El contrato se ha actualizado correctamente.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        GetContracts();
      }
      ResetContract();
      onClose();
    };
  
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      
      setContract((prevState) => ({
        ...prevState,
        [name]: name === "StartDate" || name === "EndDate" 
          ? new Date(value) 
          : name === "Amount" || name === "IdSuppliers"
          ? Number(value)
          : value,
      }));
    };
  
    useEffect(() => {
      if (isOpen) {
        setErrors({});
      }
    }, [isOpen]);
  
    // Formatear fechas para input type="date"
    const formatDateForInput = (date: Date | undefined) => {
      if (!date) return "";
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{titleText}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={1} spacingY="20px">
              <FormControl isInvalid={!!errors.StartDate} isRequired>
                <FormLabel htmlFor="StartDate">Fecha de Inicio</FormLabel>
                <Input
                  id="StartDate"
                  name="StartDate"
                  type="date"
                  value={formatDateForInput(contract.StartDate)}
                  onChange={handleChange}
                  focusBorderColor="teal"
                />
                <FormErrorMessage>{errors.StartDate}</FormErrorMessage>
              </FormControl>
  
              <FormControl isInvalid={!!errors.EndDate} isRequired>
                <FormLabel htmlFor="EndDate">Fecha de Fin</FormLabel>
                <Input
                  id="EndDate"
                  name="EndDate"
                  type="date"
                  value={formatDateForInput(contract.EndDate)}
                  onChange={handleChange}
                  focusBorderColor="teal"
                  min={formatDateForInput(contract.StartDate)}
                />
                <FormErrorMessage>{errors.EndDate}</FormErrorMessage>
              </FormControl>
  
              <FormControl isInvalid={!!errors.Amount} isRequired>
                <FormLabel htmlFor="Amount">Monto</FormLabel>
                <Input
                  id="Amount"
                  name="Amount"
                  type="number"
                  value={contract.Amount || ""}
                  onChange={handleChange}
                  focusBorderColor="teal"
                  min="1"
                  step="1"
                />
                <FormErrorMessage>{errors.Amount}</FormErrorMessage>
              </FormControl>
  
              <FormControl isInvalid={!!errors.Description}>
                <FormLabel htmlFor="Description">Descripción (Opcional)</FormLabel>
                <Input
                  id="Description"
                  name="Description"
                  value={contract.Description || ""}
                  onChange={handleChange}
                  focusBorderColor="teal"
                  maxLength={256}
                />
                <FormErrorMessage>{errors.Description}</FormErrorMessage>
              </FormControl>
  
              <FormControl isInvalid={!!errors.IdSuppliers} isRequired>
                <FormLabel htmlFor="IdSuppliers">Proveedor</FormLabel>
                <Select
                  id="IdSuppliers"
                  name="IdSuppliers"
                  value={contract.IdSuppliers || ""}
                  onChange={handleChange}
                  focusBorderColor="teal"
                  placeholder="Seleccione un proveedor"
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier.Id} value={supplier.Id}>
                      {supplier.Name} - {supplier.Phone}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.IdSuppliers}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="teal"
              onClick={(e) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                method === "editar" ? updateContract(e) : addContract(e);
              }}
            >
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default CreateEditContractModal;