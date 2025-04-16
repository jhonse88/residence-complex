/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { FC } from "react";
import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplierIdToDelete: string;
  onDelete: () => void;
}

const DeleteSupplierModal: FC<Props> = ({
  isOpen,
  onClose,
  supplierIdToDelete,
  onDelete,
}) => {
  const toast = useToast();

  const handleDelete = async () => {
    try {
      // // Verificar si el proveedor tiene contratos asociados
      // const contractsResponse = await axios.get(
      //   `/api/contracts?supplierId=${supplierIdToDelete}`
      // );

      // if (contractsResponse.data && contractsResponse.data.length > 0) {
      //   toast({
      //     position: "top",
      //     title: "Error",
      //     description:
      //       "El proveedor tiene contratos asociados y no puede ser desactivado.",
      //     status: "error",
      //     duration: 3000,
      //     isClosable: true,
      //   });
      //   return;
      // }

      // Desactivar el proveedor (eliminación lógica)
      await axios.delete("/api/suppliers", {
        params: { Id: supplierIdToDelete },
      });

      toast({
        position: "top",
        title: "Proveedor desactivado",
        description: "El proveedor ha sido desactivado correctamente.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      onDelete(); // Actualizar la lista de proveedores
    } catch (error) {
      console.error("Error al desactivar proveedor:", error);
      toast({
        position: "top",
        title: "Error",
        description: "Ocurrió un error al desactivar el proveedor.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Desactivar Proveedor</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>¿Estás seguro que quieres desactivar este proveedor?</Text>
          <Text mt={2} fontSize="sm" color="gray.500">
            (El proveedor será marcado como inactivo pero se mantendrán sus
            registros)
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="gray" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button colorScheme="red" onClick={handleDelete}>
            Desactivar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteSupplierModal;
