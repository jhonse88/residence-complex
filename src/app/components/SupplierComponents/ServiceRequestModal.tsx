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
  Flex,
  Text,
  Textarea,
  Badge,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  HiChevronLeft,
  HiChevronRight,
  HiStar,
  HiOutlineStar,
} from "react-icons/hi";
import { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import Joi from "joi";
import EvaluationModal from "./EvaluationModal";
import { Suppliers } from "@prisma/client";

interface ServiceRequest {
  Id: number;
  ApplicationDate: string;
  Description: string;
  IdSuppliers: number;
  Suppliers?: {
    Name: string;
  };
}

interface Evaluation {
  Id: number;
  Qualification: number;
  Comments: string;
  EvaluationDate: string;
}

const ServiceRequestModal = ({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  GetSuppliers,
  supplier
}: {
  isOpen: boolean;
  onClose: () => void;
  supplierId: number;
  supplierName: string;
  GetSuppliers: () => void;
  supplier: Suppliers;
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
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);

  const starColor = useColorModeValue("yellow.400", "yellow.300");

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
        // Obtener la evaluación después de cargar la solicitud
        await fetchEvaluation(response.data.Id);
      } else {
        setHasNext(false);
        setHasPrev(false);
        setEvaluation(null);
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

  const fetchEvaluation = async (serviceRequestId: number) => {
    try {
      const response = await axios.get(
        `/api/evaluations?serviceRequestId=${serviceRequestId}`
      );
      setEvaluation(response.data);
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      setEvaluation(null);
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
    setEvaluation(null);
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

  const handleEvaluationSaved = () => {
    if (currentRequest?.Id) {
      fetchEvaluation(currentRequest.Id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequest("last");
      setErrors({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplierId]);

  const RatingDisplay = () => (
    <HStack spacing={1} align="center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          as={star <= (evaluation?.Qualification || 0) ? HiStar : HiOutlineStar}
          color={
            star <= (evaluation?.Qualification || 0) ? starColor : "gray.300"
          }
          boxSize={4}
        />
      ))}
      {evaluation?.Qualification && (
        <Badge colorScheme="blue" ml={1}>
          {evaluation.Qualification}/5
        </Badge>
      )}
    </HStack>
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex direction="column">
              <Text fontSize="xl">Solicitud de servicio</Text>
              <Text fontSize="sm" color="gray.500">
                Proveedor: {supplierName}
              </Text>
              {evaluation && (
                <Flex align="center" mt={2}>
                  <Text fontSize="sm" mr={2}>
                    Calificación:
                  </Text>
                  <RatingDisplay />
                </Flex>
              )}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoading ? (
              <Flex justify="center" align="center" minH="200px">
                <Text>Cargando...</Text>
              </Flex>
            ) : (
              <>
                <Flex justify="space-between" mb={4}>
                  <Button
                    colorScheme="teal"
                    onClick={createNewRequest}
                    isDisabled={isLoading || supplier.State === false}
                    size="sm"
                  >
                    Nueva Solicitud
                  </Button>
                  {currentRequest?.Id ? (
                    <Button
                      colorScheme="blue"
                      onClick={() => setIsEvaluationModalOpen(true)}
                      isDisabled={isLoading}
                      size="sm"
                      variant={evaluation ? "outline" : "solid"}
                    >
                      {evaluation
                        ? "Ver Calificación"
                        : "Calificar Servicio"}
                    </Button>
                  ): null}
                </Flex>

                <SimpleGrid columns={1} spacingY={4}>
                  <FormControl isInvalid={!!errors.ApplicationDate} isRequired>
                    <FormLabel fontSize="sm">Fecha y Hora</FormLabel>
                    <Input
                      name="ApplicationDate"
                      value={
                        currentRequest?.ApplicationDate
                          ? formatToDatetimeLocal(
                              currentRequest.ApplicationDate
                            )
                          : ""
                      }
                      onChange={handleChange}
                      type="datetime-local"
                      size="sm"
                      isReadOnly
                    />
                    <FormErrorMessage fontSize="xs">
                      {errors.ApplicationDate}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.Description} isRequired>
                    <FormLabel fontSize="sm">Descripción</FormLabel>
                    <Textarea
                      name="Description"
                      value={currentRequest?.Description || ""}
                      onChange={handleChange}
                      size="sm"
                      rows={4}
                    />
                    <FormErrorMessage fontSize="xs">
                      {errors.Description}
                    </FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                {currentRequest?.Id ? (
                  <Flex justify="space-between" mt={6}>
                    <Button
                      leftIcon={<Icon as={HiChevronLeft} />}
                      onClick={() => fetchRequest("prev")}
                      isDisabled={!hasPrev || isLoading || isCreating}
                      size="sm"
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    <Button
                      rightIcon={<Icon as={HiChevronRight} />}
                      onClick={() => fetchRequest("next")}
                      isDisabled={!hasNext || isLoading || isCreating}
                      size="sm"
                      variant="outline"
                    >
                      Siguiente
                    </Button>
                  </Flex>
                ): null}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3} size="sm" variant="ghost">
              Cerrar
            </Button>
            <Button
              colorScheme="teal"
              onClick={saveRequest}
              isLoading={isLoading}
              isDisabled={!currentRequest}
              size="sm"
            >
              Guardar Solicitud
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {currentRequest?.Id && (
        <EvaluationModal
          isOpen={isEvaluationModalOpen}
          onClose={() => setIsEvaluationModalOpen(false)}
          serviceRequestId={currentRequest.Id}
          supplierId={supplierId}
          currentRating={evaluation?.Qualification}
          currentComments={evaluation?.Comments}
          onEvaluationSaved={handleEvaluationSaved}
          GetSuppliers={GetSuppliers} 
          supplier={supplier}
          />
      )}
    </>
  );
};

export default ServiceRequestModal;
