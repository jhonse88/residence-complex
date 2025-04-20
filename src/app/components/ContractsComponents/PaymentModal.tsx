/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Select,
  InputGroup,
  InputRightAddon,
  InputLeftAddon,
} from "@chakra-ui/react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import Joi from "joi";
import { Contracts } from "@prisma/client";

interface Payment {
  Id: number;
  PaymentDate: string;
  Amount: number;
  PaymentMethod: string;
  IdContracts: number;
  Contracts?: {
    ContractNumber: string;
  };
}

const PaymentModal = ({
  isOpen,
  onClose,
  contractId,
  contractNumber,
  GetContracts,
}: {
  isOpen: boolean;
  onClose: () => void;
  contractId: number;
  contractNumber: string;
  GetContracts: () => void;
}) => {
  const toast = useToast();
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [contractDebt, setContractDebt] = useState<number>(0); // Nuevo estado

  const paymentMethods = [
    "Efectivo",
    "Transferencia Bancaria",
    "Tarjeta de Crédito",
    "Tarjeta de Débito",
    "Cheque",
    "Otro",
  ];

  const paymentSchema = Joi.object({
    PaymentDate: Joi.date().iso().required().messages({
      "date.base": "La fecha y hora deben ser válidas",
      "date.iso": "El formato de fecha y hora debe ser ISO válido",
      "any.required": "La fecha y hora son obligatorias",
    }),
    Amount: Joi.number()
      .required()
      .min(1)
      .max(contractDebt) // Nueva validación
      .messages({
        "number.base": "El monto debe ser un número válido",
        "number.min": "El monto debe ser mayor a 0",
        "number.max": `El monto no puede superar la deuda actual de $${contractDebt.toLocaleString()}`,
        "any.required": "El monto es obligatorio",
      }),
    PaymentMethod: Joi.string().required().messages({
      "string.empty": "El método de pago es obligatorio",
    }),
    IdContracts: Joi.number().required(),
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
    if (!currentPayment) return false;

    const { error } = paymentSchema.validate(currentPayment, {
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

  const fetchPayment = async (direction?: "next" | "prev" | "last") => {
    try {
    // Obtener la deuda del contrato
      const contractResponse = await axios.get(`/api/contracts/${contractId}`);
      setContractDebt(contractResponse.data.Debt || 0);

      setIsLoading(true);
      const params = {
        contractId,
        ...(currentPayment?.Id && { currentId: currentPayment.Id }),
        ...(direction && { direction }),
      };


      
      const response = await axios.get("/api/payments", { params });

      const checkNeighbors = async () => {
        try {
          const nextRes = await axios.get("/api/payments", {
            params: {
              contractId,
              currentId: response.data.Id,
              direction: "next",
            },
          });
          setHasNext(!!nextRes.data);

          const prevRes = await axios.get("/api/payments", {
            params: {
              contractId,
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

      setCurrentPayment(response.data);
      setIsCreating(false);
    } catch (error) {
      console.error("Error fetching payment:", error);
      toast({
        position: "top",
        title: "Error",
        description: "No se pudo cargar el pago",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewPayment = () => {
    setCurrentPayment({
      Id: 0,
      PaymentDate: new Date().toISOString(),
      Amount: 0,
      PaymentMethod: "",
      IdContracts: contractId,
    });
    setIsCreating(true);
    setHasNext(false);
    setHasPrev(false);
  };

  const savePayment = async () => {
    if (!currentPayment || !validateForm()) {
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
      const url = "/api/payments";
      const response = currentPayment.Id
        ? await axios.put(url, currentPayment)
        : await axios.post(url, currentPayment);

      toast({
        position: "top",
        description: "Pago guardado exitosamente.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      GetContracts(); // Actualizar la lista de contratos

      // Después de guardar, cargar el último pago (que incluirá el recién creado)
      await fetchPayment("last");
    } catch (error) {
      toast({
        position: "top",
        title: "Error",
        description: "Ocurrió un error al guardar el pago",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!currentPayment || currentPayment.Id !== 0) return; // Solo permite cambios en nuevos pagos

    const { name, value } = e.target;

    setCurrentPayment({
      ...currentPayment,
      [name]:
        name === "PaymentDate"
          ? parseDatetimeLocal(value)
          : name === "Amount"
          ? Number(value)
          : value,
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayment("last");
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contractId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex direction="column">
            <Text fontSize="xl">Registro de Pago</Text>
            <Text fontSize="sm" color="gray.500">
              Contrato: {contractNumber}
            </Text>
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
              <Flex justify="flex-start" mb={4}>
                <Button
                  colorScheme="teal"
                  onClick={createNewPayment}
                  isDisabled={isLoading}
                  size="sm"
                >
                  Nuevo Pago
                </Button>
              </Flex>

              <SimpleGrid columns={1} spacingY={4}>
                <FormControl isInvalid={!!errors.PaymentDate} isRequired>
                  <FormLabel fontSize="sm">Fecha y Hora</FormLabel>
                  <Input
                    name="PaymentDate"
                    value={
                      currentPayment?.PaymentDate
                        ? formatToDatetimeLocal(currentPayment.PaymentDate)
                        : ""
                    }
                    onChange={handleChange}
                    type="datetime-local"
                    size="sm"
                    isReadOnly={currentPayment?.Id !== 0} 
                  />
                  <FormErrorMessage fontSize="xs">
                    {errors.PaymentDate}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.Amount} isRequired>
                  <FormLabel fontSize="sm">Monto</FormLabel>
                  <InputGroup size="sm">
                  <InputLeftAddon>$</InputLeftAddon>
                    <Input
                      name="Amount"
                      type="number"
                      value={currentPayment?.Amount || ""}
                      onChange={handleChange}
                      size="sm"
                      isReadOnly={currentPayment?.Id !== 0}
                      max={contractDebt}
                      
                    />
                  </InputGroup>
                  <FormErrorMessage fontSize="xs">
                    {errors.Amount}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.PaymentMethod} isRequired>
                  <FormLabel fontSize="sm">Método de Pago</FormLabel>
                  <Select
                    name="PaymentMethod"
                    value={currentPayment?.PaymentMethod || ""}
                    onChange={handleChange}
                    placeholder="Seleccione método"
                    size="sm"
                    isReadOnly={currentPayment?.Id !== 0} // Solo editable en nuevos pagos
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage fontSize="xs">
                    {errors.PaymentMethod}
                  </FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              {currentPayment?.Id ? (
                <Flex justify="space-between" mt={6}>
                  <Button
                    leftIcon={<HiChevronLeft />}
                    onClick={() => fetchPayment("prev")}
                    isDisabled={!hasPrev || isLoading}
                    size="sm"
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <Button
                    rightIcon={<HiChevronRight />}
                    onClick={() => fetchPayment("next")}
                    isDisabled={!hasNext || isLoading}
                    size="sm"
                    variant="outline"
                  >
                    Siguiente
                  </Button>
                </Flex>
              ) : null}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr={3} size="sm" variant="ghost">
            Cerrar
          </Button>
          <Button
            colorScheme="teal"
            onClick={savePayment}
            isLoading={isLoading}
            isDisabled={!currentPayment || currentPayment?.Id !== 0} // Solo muestra para nuevos pagos
            size="sm"
          >
            Guardar Pago
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
