import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
  Flex,
  Text,
  Textarea
} from "@chakra-ui/react";
import axios from "axios";
import { useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

interface ServiceRequest {
  Id: number;
  ApplicationDate: string;
  Description: string;
  IdSuppliers: number;
  Suppliers?: {
    Name: string;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplierId: number;
}

const ServiceRequestModal: React.FC<Props> = ({ isOpen, onClose, supplierId }) => {
  const toast = useToast();
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchRequest = async (id?: number, direction?: 'prev' | 'next') => {
    try {
      setIsLoading(true);
      let url = `/api/serviceRequests`;
      
      if (id && direction) {
        url += `?currentId=${id}&direction=${direction}`;
      } else if (supplierId) {
        url += `?IdSuppliers=${supplierId}`;
      }
      
      const res = await axios.get(url);
      setCurrentRequest(res.data);
      setIsCreating(false);
    } catch (error) {
      console.error("Error fetching request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLastRequest = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/serviceRequests');
      setCurrentRequest(res.data);
    } catch (error) {
      console.error("Error fetching last request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setCurrentRequest({
      Id: 0,
      ApplicationDate: new Date().toISOString().split('T')[0],
      Description: '',
      IdSuppliers: supplierId
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    try {
      if (!currentRequest?.Description) {
        toast({
          title: "Error",
          description: "La descripción es requerida",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const res = await axios.post('/api/serviceRequests', currentRequest);
      
      toast({
        title: "Éxito",
        description: "Solicitud guardada correctamente",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      
      // Recargar la última solicitud después de guardar
      await fetchLastRequest();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar la solicitud",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentRequest(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  useEffect(() => {
    if (isOpen && supplierId) {
      fetchLastRequest();
    }
  }, [isOpen, supplierId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isCreating ? "Nueva Solicitud" : "Solicitud de Servicio"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Text>Cargando...</Text>
          ) : (
            <>
              {currentRequest && (
                <>
                  <FormControl mb={4}>
                    <FormLabel>Proveedor</FormLabel>
                    <Input 
                      value={currentRequest.Suppliers?.Name || ''}
                      isReadOnly
                      variant="filled"
                    />
                  </FormControl>

                  <FormControl mb={4}>
                    <FormLabel>Fecha de Solicitud</FormLabel>
                    <Input
                      type="date"
                      name="ApplicationDate"
                      value={currentRequest.ApplicationDate}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl mb={4}>
                    <FormLabel>Descripción</FormLabel>
                    <Textarea
                      name="Description"
                      value={currentRequest.Description}
                      onChange={handleChange}
                      placeholder="Descripción del servicio requerido"
                      rows={4}
                    />
                  </FormControl>
                </>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Flex justifyContent="space-between" width="100%">
            <Flex>
              {!isCreating && currentRequest && (
                <>
                  <Button 
                    leftIcon={<HiChevronLeft />}
                    onClick={() => fetchRequest(currentRequest.Id, 'prev')}
                    mr={2}
                    isDisabled={isLoading}
                  >
                    Anterior
                  </Button>
                  <Button 
                    rightIcon={<HiChevronRight />}
                    onClick={() => fetchRequest(currentRequest.Id, 'next')}
                    isDisabled={isLoading}
                  >
                    Siguiente
                  </Button>
                </>
              )}
            </Flex>
            
            <Flex>
              <Button variant="outline" mr={3} onClick={onClose}>
                Cerrar
              </Button>
              {isCreating ? (
                <Button colorScheme="blue" onClick={handleSave}>
                  Guardar
                </Button>
              ) : (
                <Button colorScheme="green" onClick={handleCreateNew}>
                  Nueva Solicitud
                </Button>
              )}
            </Flex>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ServiceRequestModal;