/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  HStack,
  Icon,
  Text,
  Textarea,
  useToast,
  Box,
  useColorModeValue,
  Text as ChakraText,
} from "@chakra-ui/react";
import { HiStar, HiOutlineStar, HiPencil } from "react-icons/hi";
import { useState, useEffect } from "react";
import axios from "axios";
import { Suppliers } from "@prisma/client";

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRequestId: number;
  supplierId: number;
  currentRating?: number;
  currentComments?: string;
  onEvaluationSaved: () => void;
  GetSuppliers: () => void;
  supplier: Suppliers;
}

const EvaluationModal = ({
  isOpen,
  onClose,
  serviceRequestId,
  supplierId,
  currentRating = 0,
  currentComments = "",
  onEvaluationSaved,
  GetSuppliers,
  supplier
}: EvaluationModalProps) => {
  const [rating, setRating] = useState(currentRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState(currentComments);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const toast = useToast();
  const starColor = useColorModeValue("yellow.400", "yellow.300");

  // Cargar los datos actuales al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchEvaluation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchEvaluation = async () => {
    try {
      setIsFetching(true);
      const response = await axios.get(
        `/api/evaluations?serviceRequestId=${serviceRequestId}`
      );

      if (response.data) {
        setRating(response.data.Qualification);
        setComments(response.data.Comments || "");
      } else {
        setRating(0);
        setComments("");
      }

      // Si no existe evaluación, entrar directamente en modo edición
      setIsEditing(!response.data);
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la evaluación",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      setIsLoading(true);
      await axios.patch("/api/evaluations", {
        IdServiceRequests: serviceRequestId,
        IdSuppliers: supplierId,
        Qualification: rating,
        Comments: comments,
      });

      toast({
        title: "Evaluación guardada",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      onEvaluationSaved();
      setIsEditing(false); // Volver al modo vista después de guardar
      GetSuppliers()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la evaluación",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (currentRating) {
      // Si ya existía una evaluación, volver a los valores originales
      setRating(currentRating);
      setComments(currentComments || "");
      setIsEditing(false);
    } else {
      // Si no existía evaluación, cerrar el modal
      onClose();
    }
  };

  const renderStars = (value: number) => {
    return (
      <HStack spacing={1}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            as={star <= value ? HiStar : HiOutlineStar}
            key={star}
            boxSize={6}
            color={star <= value ? starColor : "gray.300"}
          />
        ))}
      </HStack>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      onCloseComplete={() => setIsEditing(false)}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEditing ? "Editar Calificación" : "Calificación del Servicio"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isFetching ? (
            <Box textAlign="center" py={4}>
              <Text>Cargando evaluación...</Text>
            </Box>
          ) : (
            <>
              <Box mb={4}>
                <Text mb={2} fontWeight="semibold">
                  Calificación:
                </Text>
                {isEditing ? (
                  <HStack spacing={1}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        as={
                          star <= (hoverRating || rating)
                            ? HiStar
                            : HiOutlineStar
                        }
                        key={star}
                        boxSize={6}
                        color={
                          star <= (hoverRating || rating)
                            ? starColor
                            : "gray.300"
                        }
                        cursor="pointer"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    ))}
                  </HStack>
                ) : (
                  renderStars(rating)
                )}
              </Box>

              <Box mb={4}>
                <Text fontWeight="semibold" mb={2}>
                  Comentarios:
                </Text>
                {isEditing ? (
                  <Textarea
                    placeholder="Escribe tus comentarios aquí"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                ) : (
                  <Box
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="gray.200"
                    minH="100px"
                  >
                    {comments ? (
                      <ChakraText whiteSpace="pre-wrap">{comments}</ChakraText>
                    ) : (
                      <ChakraText color="gray.500">
                        No hay comentarios
                      </ChakraText>
                    )}
                  </Box>
                )}
              </Box>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                mr={3}
                onClick={handleCancelEditing}
                isDisabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSaveEvaluation}
                isLoading={isLoading}
                isDisabled={rating === 0}
              >
                Guardar Cambios
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cerrar
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleStartEditing}
                isDisabled={supplier.State === false}
                leftIcon={<Icon as={HiPencil} />}
              >
                Editar
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EvaluationModal;
