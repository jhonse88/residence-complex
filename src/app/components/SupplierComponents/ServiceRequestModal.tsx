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
  Flex,
  Text,
  Textarea,
} from "@chakra-ui/react";
import axios from "axios";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import Joi from "joi";

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
  supplierName: string;
}

const ServiceRequestModal: FC<Props> = ({
  isOpen,
  onClose,
  supplierId,
  supplierName,
}) => {
  const toast = useToast();
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const requestSchema = Joi.object({
    ApplicationDate: Joi.date().iso().required().messages({
      "date.base": "La fecha y hora deben ser válidas",
      "date.iso": "El formato de fecha y hora debe ser ISO válido",
      "any.required": "La fecha y hora son obligatorias",
    }),
    Description: Joi.string().required().max(500).messages({
      "string.empty": "La descripción es obligatoria",
      "string.max": "La descripción no puede exceder los 500 caracteres",
    }),
    IdSuppliers: Joi.number().required(),
  });

  // Función para formatear a datetime-local
  const formatToDatetimeLocal = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Función para convertir de datetime-local a ISO
  const parseDatetimeLocal = (datetimeLocal: string) => {
    if (!datetimeLocal) return "";
    return new Date(datetimeLocal).toISOString();
  };

  const validateForm = () => {
    if (!currentRequest) return false;

    const { error } = requestSchema.validate(currentRequest, {
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

  const fetchRequest = async (direction?: "next" | "prev" | "last") => {
    try {
      setIsLoading(true);
      const params = {
        supplierId,
        ...(currentRequest?.Id && { currentId: currentRequest.Id }),
        ...(direction && { direction }),
      };

      const response = await axios.get("/api/serviceRequests", { params });

      // Verificar si hay más registros
      const checkNeighbors = async () => {
        try {
          const nextRes = await axios.get("/api/serviceRequests", {
            params: {
              supplierId,
              currentId: response.data.Id,
              direction: "next",
            },
          });
          setHasNext(!!nextRes.data);

          const prevRes = await axios.get("/api/serviceRequests", {
            params: {
              supplierId,
              currentId: response.data.Id,
              direction: "prev",
            },
          });
          setHasPrev(!!prevRes.data);
        } catch (error) {
          setHasNext(false);
          setHasPrev(false);
        }
      };

      if (response.data?.Id) {
        await checkNeighbors();
      } else {
        setHasNext(false);
        setHasPrev(false);
      }

      setCurrentRequest(response.data);
      setIsCreating(false);
    } catch (error) {
      console.error("Error fetching request:", error);
      toast({
        position: "top",
        title: "Error",
        description: "No se pudo cargar la solicitud",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewRequest = () => {
    setCurrentRequest({
      Id: 0,
      ApplicationDate: new Date().toISOString(),
      Description: "",
      IdSuppliers: supplierId,
    });
    setIsCreating(true);
    setHasNext(false);
    setHasPrev(false);
  };

  const saveRequest = async () => {
    if (!currentRequest || !validateForm()) {
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
      setIsLoading(true);
      const method = currentRequest.Id ? "PUT" : "POST";
      const url = "/api/serviceRequests";

      const response = currentRequest.Id
        ? await axios.put(url, currentRequest)
        : await axios.post(url, currentRequest);

      toast({
        position: "top",
        description: "Solicitud guardada exitosamente.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // Recargar la última solicitud (que será la recién creada/actualizada)
      await fetchRequest("last");
    } catch (error) {
      toast({
        position: "top",
        title: "Error",
        description: "Ocurrió un error al guardar la solicitud",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!currentRequest) return;

    const { name, value } = e.target;

    setCurrentRequest({
      ...currentRequest,
      [name]: name === "ApplicationDate" ? parseDatetimeLocal(value) : value,
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequest("last");
      setErrors({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplierId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text fontSize="xl">Solicitud de servicio</Text>
          <Text fontSize="sm" color="gray.500">
            Proveedor: {supplierName}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Flex justify="center" align="center" minH="200px">
              <Text>Cargando...</Text>
            </Flex>
          ) : (
            <>
              <Flex justify="flex-start" mb={2}>
                <Button
                  colorScheme="teal"
                  onClick={createNewRequest}
                  isDisabled={isLoading}
                  size={'sm'}
                >
                  Nueva Solicitud
                </Button>
              </Flex>

              <SimpleGrid columns={1} spacingY="20px">
                <FormControl isInvalid={!!errors.ApplicationDate} isRequired>
                  <FormLabel htmlFor="ApplicationDate">Fecha y Hora</FormLabel>
                  <Input
                    id="ApplicationDate"
                    name="ApplicationDate"
                    value={currentRequest?.ApplicationDate ? formatToDatetimeLocal(currentRequest.ApplicationDate) : ""}
                    onChange={handleChange}
                    focusBorderColor="lime"
                    variant="filled"
                    type="datetime-local"
                  />
                  <FormErrorMessage>{errors.ApplicationDate}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.Description} isRequired>
                  <FormLabel htmlFor="Description">Descripción</FormLabel>
                  <Textarea
                    id="Description"
                    name="Description"
                    value={currentRequest?.Description || ""}
                    onChange={handleChange}
                    focusBorderColor="lime"
                    variant="filled"
                    rows={4}
                  />
                  <FormErrorMessage>{errors.Description}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <Flex justify="space-between" mt={6}>
                <Button
                  leftIcon={<HiChevronLeft />}
                  onClick={() => fetchRequest("prev")}
                  isDisabled={!hasPrev || isLoading || isCreating}
                >
                  Anterior
                </Button>

                <Button
                  rightIcon={<HiChevronRight />}
                  onClick={() => fetchRequest("next")}
                  isDisabled={!hasNext || isLoading || isCreating}
                >
                  Siguiente
                </Button>
              </Flex>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="gray" mr={3} onClick={onClose}>
            Cerrar
          </Button>
          <Button
            colorScheme="teal"
            onClick={saveRequest}
            isLoading={isLoading}
            isDisabled={!currentRequest}
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ServiceRequestModal;
