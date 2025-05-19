"use client"

import React, { useCallback, useState } from "react"
import {
  Button,
  Center,
  InputGroup,
  InputRightElement,
  Stack,
  Input,
  useToast,
} from "@chakra-ui/react"
import { TbEye, TbEyeOff } from "react-icons/tb"
import Joi from "joi"
import { useRouter } from "next/navigation"

const SignUpForm = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = React.useState(false)
  const toast = useToast()
  const router = useRouter()
  const handleClick = () => setShow(!show)

  const validateForm = useCallback(() => {
    const formToValidate = { email, password }

    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          "string.email": "El correo no es válido.",
          "string.empty": "El correo es obligatorio.",
        }),
      password: Joi.string()
        .min(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
        .required()
        .messages({
          "string.min": "La contraseña debe tener al menos 8 caracteres.",
          "string.pattern.base":
            "La contraseña debe tener al menos una mayúscula, una minúscula y un número.",
          "string.empty": "La contraseña es obligatoria.",
        }),
    })

    const { error } = schema.validate(formToValidate, { abortEarly: false })

    if (error) {
      error.details.forEach((detail) => {
        toast({
          title: "Error en el formulario",
          description: detail.message,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        })
      })
      return false
    }

    return true
  }, [email, password, toast])

  const handleSubmit = async () => {
    if (!validateForm()) return

    toast({
      title: "Creando cuenta...",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top",
    })

    try {
      const response = await fetch('/api/signUp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la cuenta')
      }

      toast({
        title: "Éxito",
        description: "Cuenta creada exitosamente. Redirigiendo a inicio de sesión...",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      })

      router.push("/auth/signin")
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear la cuenta. Inténtalo nuevamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
    }
  }


  return (
    <>
      <Center>
        <Stack spacing={7}>
          <Input
            variant="filled"
            placeholder="Correo@ejemplo.com"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputGroup size="md">
            <Input
              variant="filled"
              pr="4.5rem"
              type={show ? "text" : "password"}
              placeholder="Ingresar contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleClick}>
                {show ? (
                  <TbEye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <TbEyeOff className="text-2xl text-default-400 pointer-events-none" />
                )}
              </Button>
            </InputRightElement>
          </InputGroup>
          <Button
            colorScheme="teal"
            variant="outline"
            size="md"
            onClick={handleSubmit}
          >
            Crear
          </Button>
        </Stack>
      </Center>
    </>
  )
}

export default SignUpForm
