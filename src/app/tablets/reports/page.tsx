'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Badge
} from '@chakra-ui/react'
import { HiDownload, HiCalendar, HiDocumentReport } from 'react-icons/hi'
import axios from 'axios'
import { WeeklyReportRequestDto } from '../../../application/dto/ReportDto'
import { WeeklyPaymentReportData } from '../../../shared/types/Report'

export default function ReportsPage() {
  const [formData, setFormData] = useState<WeeklyReportRequestDto>({
    startDate: '',
    endDate: ''
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<WeeklyPaymentReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Evitar hidratación inconsistente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calcular fechas por defecto (última semana) solo en el cliente
  useEffect(() => {
    if (isClient) {
      const today = new Date()
      const lastWeek = new Date(today)
      lastWeek.setDate(today.getDate() - 7)
      
      setFormData(prev => ({
        ...prev,
        startDate: lastWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }))
    }
  }, [isClient])

  const handleInputChange = (field: keyof WeeklyReportRequestDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const generateReport = async () => {
    if (!formData.startDate || !formData.endDate) {
      setError('Selecciona un rango de fechas válido')
      return
    }

    setIsGenerating(true)
    setError(null)
    setMessage('Generando reporte...')

    try {
      const response = await axios.post('/api/reports/weekly-payments', formData)

      if (response.data.success) {
        setReportData(response.data.data)
        setMessage('Reporte generado exitosamente')
      } else {
        setError(response.data.error || 'Error generando el reporte')
      }
    } catch (error) {
      console.error('Error generando reporte:', error)
      setError('Error generando el reporte')
      setMessage('Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Mostrar loading mientras se hidrata
  if (!isClient) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4}>Cargando...</Text>
      </Box>
    )
  }

  return (
    <Box maxW="1200px" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Título */}
        <Box>
          <Heading size="lg" mb={2}>
            <HiDocumentReport style={{ display: 'inline', marginRight: '8px' }} />
            Generador de Reportes Semanales
          </Heading>
          <Text color="gray.600">
            Genera reportes de pagos a proveedores en formato JSON
          </Text>
        </Box>

        {/* Mensajes */}
        {message && (
          <Alert status="info">
            <AlertIcon />
            {message}
          </Alert>
        )}

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Formulario */}
          <Card>
            <CardHeader>
              <Heading size="md">Configuración del Reporte</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Rango de fechas */}
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Fecha de Fin</FormLabel>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </FormControl>
                </HStack>


                {/* Botón */}
                <Button
                  colorScheme="green"
                  onClick={generateReport}
                  isLoading={isGenerating}
                  loadingText="Generando..."
                  leftIcon={<HiDownload />}
                  size="lg"
                  width="100%"
                >
                  Generar Reporte JSON
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Reporte JSON */}
          <Card>
            <CardHeader>
              <Heading size="md">Reporte Generado</Heading>
            </CardHeader>
            <CardBody>
              {isGenerating ? (
                <VStack spacing={4}>
                  <Spinner size="lg" />
                  <Text>Generando reporte...</Text>
                </VStack>
              ) : reportData ? (
                <VStack spacing={4} align="stretch">
                  {/* Resumen general */}
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Total Pagos</StatLabel>
                      <StatNumber>{reportData.totalPayments}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Monto Total</StatLabel>
                      <StatNumber fontSize="lg">
                        {formatCurrency(reportData.totalAmount)}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  <Divider />

                  {/* JSON del reporte */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>Datos del Reporte (JSON)</Text>
                    <Box 
                      bg="gray.50" 
                      p={4} 
                      borderRadius="md" 
                      maxH="400px" 
                      overflowY="auto"
                      fontSize="sm"
                      fontFamily="mono"
                    >
                      <pre>{JSON.stringify(reportData, null, 2)}</pre>
                    </Box>
                  </Box>
                </VStack>
              ) : (
                <VStack spacing={4}>
                  <HiDocumentReport size={32} color="gray" />
                  <Text color="gray.500" textAlign="center">
                    Haz clic en "Generar Reporte JSON" para crear el reporte del período seleccionado
                  </Text>
                </VStack>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Box>
  )
}