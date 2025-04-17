import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    useToast,
  } from "@chakra-ui/react";
  import axios from "axios";
  import { FC } from "react";
  
  interface Props {
    isOpen: boolean;
    onClose: () => void;
    contractId: number;
    onDelete: () => void;
  }
  
  const DeleteContractModal: FC<Props> = ({
    isOpen,
    onClose,
    contractId,
    onDelete,
  }) => {
    const toast = useToast();
  
    const handleDelete = async () => {
      try {
        const response = await axios.delete("/api/contracts", {
          params: { Id: contractId },
        });
  
        if (response.status === 200) {
          toast({
            title: "Contrato eliminado",
            description: "El contrato ha sido eliminado correctamente.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          onDelete();
          onClose();
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast({
          title: "Error",
          description:
            error.response?.data?.error ||
            "Ocurrió un error al eliminar el contrato",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Eliminar Contrato</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>¿Estás seguro que deseas eliminar este contrato?</Text>
            <Text mt={2} color="red.500" fontWeight="bold">
              Esta acción no se puede deshacer.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default DeleteContractModal;