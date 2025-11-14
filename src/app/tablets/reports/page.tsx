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

interface PaymentStatistics {
  totalPayments: number
  totalAmount: number
  paymentsByMethod: Record<string, { count: number; total: number }>
  paymentsBySupplier: Record<string, { count: number; total: number }>
}

export default function ReportsPage() {
  const [formData, setFormData] = useState<WeeklyReportRequestDto>({
    startDate: '',
    endDate: '',
    format: 'pdf',
    includeCharts: false,
    includeSummary: true,
    customTitle: ''
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null)
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

  const loadStatistics = async () => {
    if (!formData.startDate || !formData.endDate) {
      setError('Selecciona un rango de fechas válido')
      return
    }

    setIsLoadingStats(true)
    setError(null)
    setMessage('Cargando estadísticas...')

    try {
      const response = await axios.get('/api/reports/statistics', {
        params: {
          startDate: formData.startDate,
          endDate: formData.endDate
        }
      })

      setStatistics(response.data)
      setMessage('Estadísticas cargadas correctamente')
    } catch (error) {
      setError('Error cargando estadísticas')
      setMessage('Error al cargar estadísticas')
    } finally {
      setIsLoadingStats(false)
    }
  }

  const generateReport = async () => {
    if (!formData.startDate || !formData.endDate) {
      setError('Selecciona un rango de fechas válido')
      return
    }

    setIsGenerating(true)
    setError(null)
    setMessage('Generando reporte...')

    // Log en el cliente
    console.log('🟢 CLIENTE: Enviando petición de reporte mejorado')
    console.log('🟢 Datos:', formData)

    try {
      // Usar el endpoint mejorado con State + Adapter
      const response = await axios.post('/api/reports/enhanced-weekly-payments', {
        ...formData,
        userType: 'basic_user' // Puedes hacerlo dinámico según el usuario logueado
      }, {
        responseType: 'blob' // Importante: recibir como blob para descargar
      })

      console.log('🟢 CLIENTE: Respuesta recibida (blob)')
      
      // Obtener información del estado desde los headers
      const reportState = response.headers['x-report-state'] || 'Unknown'
      const estimatedTime = response.headers['x-report-estimated-time'] || '0'
      
      console.log('🟢 Estado del reporte:', reportState)
      console.log('🟢 Tiempo estimado:', estimatedTime, 'ms')

      // Crear URL para descarga
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      })
      const url = window.URL.createObjectURL(blob)
      
      // Obtener nombre del archivo del header
      const contentDisposition = response.headers['content-disposition']
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `reporte_pagos_${formData.startDate}_${formData.endDate}.${formData.format}`

      console.log('🟢 Archivo a descargar:', filename)

      // Crear enlace de descarga
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setMessage(`Reporte generado y descargado exitosamente. Estado: ${reportState}`)
    } catch (error: any) {
      console.error('🟢 CLIENTE: Error en la petición:', error)
      
      // Si el error tiene un mensaje JSON, intentar parsearlo
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string)
            setError(errorData.error || 'Error generando el reporte')
            setMessage(`Error: ${errorData.error || 'Error al generar el reporte'}`)
          } catch {
            setError('Error generando el reporte')
            setMessage('Error al generar el reporte')
          }
        }
        reader.readAsText(error.response.data)
      } else {
        setError(error.response?.data?.error || 'Error generando el reporte')
        setMessage('Error al generar el reporte')
      }
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
            Genera reportes de pagos a proveedores en formato PDF o Excel
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

                {/* Formato */}
                <FormControl>
                  <FormLabel>Formato del Reporte</FormLabel>
                  <Select
                    value={formData.format}
                    onChange={(e) => handleInputChange('format', e.target.value)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel (XLSX)</option>
                  </Select>
                </FormControl>

                {/* Título personalizado */}
                <FormControl>
                  <FormLabel>Título Personalizado (Opcional)</FormLabel>
                  <Input
                    placeholder="Ej: Reporte de Pagos - Enero 2024"
                    value={formData.customTitle}
                    onChange={(e) => handleInputChange('customTitle', e.target.value)}
                  />
                </FormControl>

                {/* Opciones */}
                <VStack spacing={3} align="stretch">
                  <Checkbox
                    isChecked={formData.includeSummary}
                    onChange={(e) => handleInputChange('includeSummary', e.target.checked)}
                  >
                    Incluir resumen ejecutivo
                  </Checkbox>
                  <Checkbox
                    isChecked={formData.includeCharts}
                    onChange={(e) => handleInputChange('includeCharts', e.target.checked)}
                    isDisabled={true}
                    opacity={0.5}
                  >
                    Incluir gráficos y estadísticas (próximamente)
                  </Checkbox>
                </VStack>

                {/* Botones */}
                <HStack spacing={4}>
                  <Button
                    colorScheme="blue"
                    onClick={loadStatistics}
                    isLoading={isLoadingStats}
                    loadingText="Cargando..."
                    leftIcon={<HiCalendar />}
                    flex={1}
                  >
                    Ver Estadísticas
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={generateReport}
                    isLoading={isGenerating}
                    loadingText="Generando..."
                    leftIcon={<HiDownload />}
                    flex={1}
                  >
                    Generar Reporte
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Estadísticas */}
          <Card>
            <CardHeader>
              <Heading size="md">Estadísticas del Período</Heading>
            </CardHeader>
            <CardBody>
              {isLoadingStats ? (
                <VStack spacing={4}>
                  <Spinner size="lg" />
                  <Text>Cargando estadísticas...</Text>
                </VStack>
              ) : statistics ? (
                <VStack spacing={4} align="stretch">
                  {/* Resumen general */}
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Total Pagos</StatLabel>
                      <StatNumber>{statistics.totalPayments}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Monto Total</StatLabel>
                      <StatNumber fontSize="lg">
                        {formatCurrency(statistics.totalAmount)}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  <Divider />

                  {/* Por método de pago */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>Por Método de Pago</Text>
                    <VStack spacing={2} align="stretch">
                      {Object.entries(statistics.paymentsByMethod).map(([method, data]) => (
                        <HStack key={method} justify="space-between">
                          <Badge colorScheme="blue">{method}</Badge>
                          <Text fontSize="sm">
                            {data.count} pagos - {formatCurrency(data.total)}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Por proveedor */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>Por Proveedor</Text>
                    <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                      {Object.entries(statistics.paymentsBySupplier).map(([supplier, data]) => (
                        <HStack key={supplier} justify="space-between">
                          <Text fontSize="sm" isTruncated maxW="150px">
                            {supplier}
                          </Text>
                          <Text fontSize="sm">
                            {data.count} - {formatCurrency(data.total)}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </VStack>
              ) : (
                <VStack spacing={4}>
                  <HiCalendar size={32} color="gray" />
                  <Text color="gray.500" textAlign="center">
                    Haz clic en "Ver Estadísticas" para cargar los datos del período seleccionado
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