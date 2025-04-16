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
} from "@chakra-ui/react";
import axios from "axios";
import { ChangeEvent, FC, SyntheticEvent, useEffect, useState } from "react";
import React from "react";
import Joi from "joi";
import { Suppliers } from "@prisma/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  GetSuppliers: () => void;
  method: string;
  setMethod: React.Dispatch<React.SetStateAction<string>>;
  supplier: Suppliers;
  setSupplier: React.Dispatch<React.SetStateAction<Suppliers>>;
  ResetSupplier: () => void;
  suppliers: Suppliers[];
}

const CreateEditSupplierModal: FC<Props> = ({
  isOpen,
  onClose,
  GetSuppliers,
  method,
  setMethod,
  supplier,
  setSupplier,
  ResetSupplier,
  suppliers,
}) => {
  const titleText = method === "crear" ? `Crear Proveedor` : `Editar Proveedor`;
  const toast = useToast();
  const [errors, setErrors] = useState<any>({});

  // Esquema de validación
  const supplierSchema = Joi.object({
    Name: Joi.string()
      .max(256)
      .required()
      .messages({
        "string.max": "El nombre no puede tener más de 256 caracteres.",
        "string.empty": "El nombre es obligatorio.",
      }),
    Phone: Joi.string()
      .pattern(/^[0-9]+$/)
      .length(10)
      .required()
      .messages({
        "string.pattern.base": "El teléfono debe contener solo números.",
        "string.length": "El teléfono debe tener exactamente 10 dígitos.",
        "string.empty": "El teléfono es obligatorio.",
      }),
    Email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(100)
      .messages({
        "string.email": "Por favor ingrese un correo electrónico válido.",
        "string.max": "El correo no puede exceder los 100 caracteres.",
      }),
    State: Joi.boolean().default(true)
  });

  const validateForm = () => {
    const validationData = {
      Name: supplier.Name,
      Phone: supplier.Phone,
      Email: supplier.Email,
      State: supplier.State
    };

    const { error } = supplierSchema.validate(validationData, { 
      abortEarly: false,
      allowUnknown: true
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

  const addSupplier = async (e: SyntheticEvent) => {
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
      const resp = await axios.post("/api/suppliers", {
        Name: supplier.Name,
        Phone: supplier.Phone,
        Email: supplier.Email,
        State: supplier.State ?? true // Valor por defecto si es undefined
      });

      if (resp.data) {
        toast({
          position: "top",
          description: "Proveedor creado exitosamente.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        GetSuppliers();
        ResetSupplier();
        onClose();
      }
    } catch (error) {
      toast({
        position: "top",
        title: "Error",
        description: "Ocurrió un error al crear el proveedor",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateSupplier = async (e: SyntheticEvent) => {
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
    
    const resp = await axios.put("/api/suppliers", supplier);
    if (resp && resp.data) {
      toast({
        position: "top",
        description: "El proveedor se ha actualizado correctamente.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      GetSuppliers();
    }
    ResetSupplier();
    onClose();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setSupplier((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

  useEffect(() => {
    if(isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{titleText}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={1} spacingY="20px">
            <FormControl isInvalid={!!errors.Name} isRequired>
              <FormLabel htmlFor="Name">Nombre</FormLabel>
              <Input
                id="Name"
                name="Name"
                value={supplier.Name}
                onChange={handleChange}
                focusBorderColor="lime"
                variant="filled"
                type="text"
              />
              <FormErrorMessage>{errors.Name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.Phone} isRequired>
              <FormLabel htmlFor="Phone">Teléfono</FormLabel>
              <Input
                id="Phone"
                name="Phone"
                value={supplier.Phone}
                onChange={handleChange}
                focusBorderColor="lime"
                variant="filled"
                type="text"
              />
              <FormErrorMessage>{errors.Phone}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.Email}>
              <FormLabel htmlFor="Email">Correo electrónico</FormLabel>
              <Input
                id="Email"
                name="Email"
                value={supplier.Email}
                onChange={handleChange}
                focusBorderColor="lime"
                variant="filled"
                type="email"
              />
              <FormErrorMessage>{errors.Email}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="teal"
            onClick={(e) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              method === "editar" ? updateSupplier(e) : addSupplier(e);
            }}
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateEditSupplierModal;