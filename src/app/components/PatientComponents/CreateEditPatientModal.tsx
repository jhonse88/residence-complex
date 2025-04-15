/* eslint-disable react-hooks/rules-of-hooks */
import { formatDate } from "@/app/utils/dateUtils";
import {
  Box,
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
  Select,
  SimpleGrid,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Patient } from "@prisma/client";
import axios from "axios";
import { ChangeEvent, FC, SyntheticEvent, useEffect, useState } from "react";
import React from "react";
import Joi from "joi";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  GetPatients: () => void;
  method: string;
  setMethod: React.Dispatch<React.SetStateAction<string>>;
  patient: Patient;
  setPatient: React.Dispatch<React.SetStateAction<Patient>>;
  selectedTipeid: string;
  setSelectedTipeid: React.Dispatch<React.SetStateAction<string>>;
  selectedSex: string;
  setSelectedSex: React.Dispatch<React.SetStateAction<string>>;
  ResetPatient: () => void;
  patients: Patient[];
}

const CreateEditPatientModal: FC<Props> = ({
  isOpen,
  onClose,
  GetPatients,
  method,
  setMethod,
  patient,
  setPatient,
  selectedTipeid,
  setSelectedTipeid,
  selectedSex,
  setSelectedSex,
  ResetPatient,
  patients,
}) => {
  const titleText = method === "crear" ? `Crear Paciente` : `Editar Paciente`;

  const toast = useToast();

  const [errors, setErrors] = useState<any>({}); // Estado para almacenar los errores

  
  // Esquema de validación
  const patientSchema = Joi.object({
    IdPa: Joi.string()
      .pattern(/^\d+$/)
      .max(20)
      .required()
      .messages({
        "string.pattern.base": "La identificación debe ser numérica.",
        "string.max": "La identificación no puede tener más de 20 caracteres.",
        "string.empty": "La identificación es obligatoria.",
      }),
      TipeId: Joi.string()
      .valid(
        "CC", "PA", "TI", "RC", "MS", "CE", "AS", "UN", "CD", "SC", "PE", "CN", "PT"
      )
      .required()
      .messages({
        "any.only": "El tipo de identificación debe ser uno de los siguientes: CC, PA, TI, RC, MS, CE, AS, UN, CD, SC, PE, CN, PT.",
        "any.required": "El tipo de identificación es obligatorio.",
        "string.empty": "El tipo de identificación no puede estar vacío.",
      }),
    FirstSurname: Joi.string()
      .max(30)
      .required()
      .messages({
        "string.max": "El primer apellido no puede tener más de 30 caracteres.",
        "string.empty": "El primer apellido es obligatorio.",
      }),
    SecondSurname: Joi.string()
      .max(30)
      .allow("")
      .messages({
        "string.max": "El segundo apellido no puede tener más de 30 caracteres.",
      }),
    FirstName: Joi.string()
      .max(20)
      .required()
      .messages({
        "string.max": "El primer nombre no puede tener más de 20 caracteres.",
        "string.empty": "El primer nombre es obligatorio.",
      }),
    SecondName: Joi.string()
      .max(20)
      .allow("")
      .messages({
        "string.max": "El segundo nombre no puede tener más de 20 caracteres.",
      }),
    BirthDate: Joi.date().required().messages({
      "date.base": "La fecha de nacimiento no es válida.",
      "any.required": "La fecha de nacimiento es obligatoria.",
    }),
    Sex: Joi.string()
      .valid("M", "F", "I")
      .required()
      .messages({
        "any.only": "El sexo debe ser Masculino, Femenino o Indeterminado.",
        "any.required": "El sexo es obligatorio.",
        "string.empty": "El sexo no puede estar vacío.",
      }),
    Phone: Joi.string()
      .pattern(/^\d+$/)
      .max(10)
      .allow("")
      .messages({
        "string.pattern.base": "El teléfono debe ser numérico.",
        "string.max": "El teléfono no puede tener más de 10 caracteres.",
      }),
    Email: Joi.string()
      .email({ tlds: { allow: false } })
      .allow("")
      .messages({
        "string.email": "El correo no es válido.",
      }),
  });

  const validateForm = (patient: any) => {
    const { error } = patientSchema.validate(patient, { abortEarly: false });
    if (error) {
      const newErrors = error.details.reduce((acc: any, curr: any) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {});
      setErrors(newErrors); // Guardar los errores en el estado
      return false; // Si hay errores, devolver false
    }
    setErrors({}); // Limpiar errores si no hay
    return true; // Si no hay errores, devolver true
  };
  


  const addPatient = async (e: SyntheticEvent) => {
    e.preventDefault();

    if (!validateForm({
      IdPa: patient.IdPa,
      TipeId: selectedTipeid,
      FirstSurname: patient.FirstSurname,
      SecondSurname: patient.SecondSurname,
      FirstName: patient.FirstName,
      SecondName: patient.SecondName,
      BirthDate: patient.BirthDate,
      Sex: selectedSex,
      Phone: patient.Phone,
      Email: patient.Email,
    })) {
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


    const existingPatient = patients.find((p) => p.IdPa === patient.IdPa);
    if (existingPatient) {
      toast({
        position: "top",
        title: "Error",
        description: "Esta Identificacion ya se creo en otro paciente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const resp = await axios.post("/api/patient", {
      IdPa: patient.IdPa,
      TipeId: selectedTipeid,
      FirstSurname: patient.FirstSurname,
      SecondSurname: patient.SecondSurname,
      FirstName: patient.FirstName,
      SecondName: patient.SecondName,
      BirthDate: patient.BirthDate,
      Sex: selectedSex,
      Phone: patient.Phone,
      Email: patient.Email,
    });
    if (resp && resp.data) {
      toast({
        position: "top",
        description: "El paciente se ha guardado correctamente.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      GetPatients();
    }
    ResetPatient();
    onClose();
  };

  const UpdatePatient = async (e: SyntheticEvent) => {
    e.preventDefault();

    if (!validateForm({
      IdPa: patient.IdPa,
      TipeId: selectedTipeid,
      FirstSurname: patient.FirstSurname,
      SecondSurname: patient.SecondSurname,
      FirstName: patient.FirstName,
      SecondName: patient.SecondName,
      BirthDate: patient.BirthDate,
      Sex: selectedSex,
      Phone: patient.Phone,
      Email: patient.Email,
    })) {
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
    
    const resp = await axios.put("/api/patient", {
      Id: patient.Id,
      IdPa: patient.IdPa,
      TipeId: selectedTipeid,
      FirstSurname: patient.FirstSurname,
      SecondSurname: patient.SecondSurname,
      FirstName: patient.FirstName,
      SecondName: patient.SecondName,
      BirthDate: patient.BirthDate,
      Sex: selectedSex,
      Phone: patient.Phone,
      Email: patient.Email,
    });
    if (resp && resp.data) {
      toast({
        position: "top",
        description: "El paciente se ha guardado correctamente.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      GetPatients();
    }
    ResetPatient();
    onClose();
  };

  const HandleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPatient((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

    useEffect(() => {
      if(isOpen){
        setErrors({})
      }
    }, [isOpen]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{titleText}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {method === "crear" && (
              <Box pb={5}>
              <FormControl isInvalid={!!errors.IdPa} isRequired>
                <FormLabel htmlFor="IdPa">Identificación</FormLabel>
                <Input
                  id="IdPa"
                  name="IdPa"
                  value={patient.IdPa}
                  onChange={(e) => setPatient({ ...patient, IdPa: e.target.value })}
                  focusBorderColor="lime"
                  variant="filled"
                  type="text"
                />
                <FormErrorMessage>{errors.IdPa}</FormErrorMessage>
              </FormControl>
            </Box>
            )}

            <SimpleGrid columns={2} spacingX="40px" spacingY="20px">
            <FormControl isInvalid={!!errors.TipeId} isRequired>
            <FormLabel htmlFor="TipeId">Tipo de Identificación</FormLabel>
              <Select
                id="TipeId"
                name="TipeId"
                focusBorderColor="lime"
                variant="filled"
                placeholder="Opciones"
                value={selectedTipeid}
                onChange={(e) => setSelectedTipeid(e.target.value)}
              >
                <option value="CC">CEDULA CIUDADANIA</option>
                <option value="PA">PASAPORTE</option>
                <option value="TI">TARJETA IDENTIDAD</option>
                <option value="RC">REGISTRO CIVIL</option>
                <option value="MS">MENOR SIN IDENTIFICACION</option>
                <option value="CE">CEDULA EXTRANJERIA</option>
                <option value="AS">ADULTO SIN IDENTIFICACION</option>
                <option value="UN">NUMERO UNICO DE IDENTIFICACION</option>
                <option value="CD">CARNET DIPLOMATICO</option>
                <option value="SC">SALVOCONDUCTO</option>
                <option value="PE">PERMISO TEMPORAL</option>
                <option value="CN">CERTIFICADO DE NACIDO VIVO</option>
                <option value="PT">PERMISO PROTECCION TEMPORAL</option>
              </Select>
              <FormErrorMessage>{errors.TipeId}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.Sex} isRequired>
              <FormLabel htmlFor="Sex">Sexo</FormLabel>
              <Select
                id="Sex"
                name="Sex"
                focusBorderColor="lime"
                variant="filled"
                placeholder="Opciones"
                value={selectedSex}
                onChange={(e) => setSelectedSex(e.target.value)}
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="I">Indeterminado</option>

              </Select>
              <FormErrorMessage>{errors.Sex}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.FirstSurname} isRequired>
              <FormLabel htmlFor="FirstSurname">Primer Apellido</FormLabel>
                <Input
                  id="FirstSurname"
                  focusBorderColor="lime"
                  onChange={HandleChange}
                  variant="filled"
                  type="text"
                  name="FirstSurname"
                  value={patient.FirstSurname}
                />
              <FormErrorMessage>{errors.FirstSurname}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.SecondSurname}>
              <FormLabel htmlFor="SecondSurname">Segundo Apellido</FormLabel>
                <Input
                  id="SecondSurname"
                  focusBorderColor="lime"
                  onChange={HandleChange}
                  variant="filled"
                  type="text"
                  name="SecondSurname"
                  value={patient.SecondSurname}
                />
              <FormErrorMessage>{errors.SecondSurname}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.FirstName} isRequired>
              <FormLabel htmlFor="FirstName">Primer Nombre</FormLabel>
                <Input
                  id="FirstName"
                  focusBorderColor="lime"
                  onChange={HandleChange}
                  variant="filled"
                  type="text"
                  name="FirstName"
                  value={patient.FirstName}
                />
              <FormErrorMessage>{errors.FirstName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.SecondName}>
              <FormLabel htmlFor="SecondName">Segundo Nombre</FormLabel>
                <Input
                  id="SecondName"
                  focusBorderColor="lime"
                  onChange={HandleChange}
                  variant="filled"
                  type="text"
                  name="SecondName"
                  value={patient.SecondName}
                />
              <FormErrorMessage>{errors.SecondName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.Phone}>
              <FormLabel htmlFor="Phone">Telefono</FormLabel>
                <Input
                  id="Phone"
                  focusBorderColor="lime"
                  onChange={HandleChange}
                  variant="filled"
                  type="text"
                  name="Phone"
                  value={patient.Phone}
                />
              <FormErrorMessage>{errors.Phone}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.Email}>
              <FormLabel htmlFor="Email">Email</FormLabel>
                <Input
                  id="Email"
                  focusBorderColor="lime"
                  onChange={HandleChange}
                  variant="filled"
                  type="text"
                  name="Email"
                  value={patient.Email}
                />
              <FormErrorMessage>{errors.Email}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.BirthDate} isRequired>
              <FormLabel htmlFor="BirthDate">Fecha de Nacimiento</FormLabel>
                <Input
                  id="BirthDate"
                  focusBorderColor="lime"
                  onChange={HandleChange}
                  variant="filled"
                  type="date"
                  name="BirthDate"
                  value={formatDate(patient.BirthDate)}
                />
              <FormErrorMessage>{errors.BirthDate}</FormErrorMessage>
              </FormControl>

            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="teal"
              mr={3}
              onClick={(e) => {
                if (method === "editar") {
                  UpdatePatient(e);
                } else if (method === "crear") {
                  addPatient(e);
                }
              }}
            >
              guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
export default CreateEditPatientModal;
