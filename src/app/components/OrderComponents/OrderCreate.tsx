/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { Diagnose, ItemOrder, Medical, Order, Patient, Service } from "@/app/types/api";
import { calcularEdad, formatDate, formatDateTime, formatearFecha } from "@/app/utils/dateUtils";
import { Box, Button, Card, Center, Grid, GridItem, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Switch, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast } from "@chakra-ui/react"
import axios from "axios";
import jsPDF from "jspdf";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, SyntheticEvent, useEffect, useState } from "react";
import biomedicalImage from 'src/app/assets/biomedical.png';
import AsyncSelect from 'react-select/async';
import { HiArrowNarrowLeft, HiArrowNarrowRight, HiDocumentDownload, HiPlus, HiTrash } from "react-icons/hi";


export default function OrderCreate() {

    const { status } = useSession();
    const { replace } = useRouter();
    const [method, setMethod] = useState<string>('');
    const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number>(0);
    const [selectedMedicalId, setSelectedMedicalId] = useState<number>(0);
    const [selectedServiceId, setSelectedServiceId] = useState<number>(0);
    const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const [temporaryItems, setTemporaryItems] = useState<ItemOrder[]>([]);
    const [orderStatus, setOrderStatus] = useState<number>(1);
    const [itemStatus, setItemStatus] = useState<number>(1);
    const { isOpen: isOpenDelete, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure()
    const [itemOrders, setItemOrders] = useState<ItemOrder[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const toast = useToast();
    const [orderId, setOrderId] = useState<number>(0);

    const ResetOrder = () => {
        setSelectedDiagnosisId(0);
        setSelectedMedicalId(0);
        setOrderStatus(1);
        setOrder(prevState => ({
            ...prevState, Id: 0,
            DateOrder: new Date(),
        }))
    }

    const [order, setOrder] = useState<Order>({
        Id: 0,
        IdPa: 0,
        DateOrder: new Date(),
        OrderStatus: 0,
        IdDiagnosis: 0,
        IdMedical: 0,

    });

    const [itemOrder, setItemOrder] = useState<ItemOrder>({
        Id: 0,
        IdOrder: 0,
        IdPa: 0,
        IdService: 0,
        ItemStatus: 0,
    });


    const addOrder = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!selectedDiagnosisId || !selectedMedicalId ||
            !order.DateOrder) {
            toast({
                position: 'top',
                title: 'Error',
                description: 'Por favor, complete todos los campos obligatorios.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        if (temporaryItems.length === 0) {
            toast({
                position: 'top',
                title: 'Error',
                description: 'Por favor, añade al menos un ítem a la orden antes de guardar.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        try {
            const resp = await axios.post('/api/order', {
                IdPa: selectedPatient?.Id,
                DateOrder: order.DateOrder,
                OrderStatus: orderStatus,
                IdDiagnosis: selectedDiagnosisId,
                IdMedical: selectedMedicalId,
            });
            if (resp && resp.data) {
                const newOrderId = resp.data.Id;

                setOrderId(newOrderId);
                console.log('addOrder->resp.data: ', resp.data);
                setLatestOrder(resp.data)
                setMethod('verorden')
                setPage(1)
                await Promise.all(temporaryItems.map(async (item) => {
                    await addItemOrder(newOrderId, item);
                }));
                setTemporaryItems([])
                fetchLatestOrder()
                fetchItemOrders()
                console.log(`/api/order?patientId=${order.IdPa}&page=${page}&pageSize=${pageSize}`);
                const response = await axios.get(`/api/order?patientId=${selectedPatient?.Id}&page=${page}&pageSize=${pageSize}`);
                const totalOrders = response.data.totalOrders;
                if (totalOrders > page) {
                    setHasMoreOrders(true)
                }



            }
        } catch (error) {
            console.error('Error al crear la orden:', error);
        }
    };

    const addTemporaryItem = () => {
        if (selectedServiceId === 0) {
            toast({
                position: 'top',
                title: 'Error',
                description: 'Por favor, selecciona un servicio antes de agregar un ítem.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        const isServiceAlreadyAdded = temporaryItems.some(item => item.IdService === selectedServiceId);

        if (isServiceAlreadyAdded) {
            toast({
                position: 'top',
                title: 'Error',
                description: 'Este servicio ya ha sido añadido a la orden.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        const newItem: ItemOrder = {
            Id: temporaryItems.length + 1,
            IdOrder: orderId,
            IdPa: selectedPatient?.Id || 0,
            IdService: selectedServiceId,
            ItemStatus: itemStatus,
        }
        setTemporaryItems([...temporaryItems, newItem]);
    }

    const handleDeleteItem = (index: number) => {
        const updatedItems = [...temporaryItems];
        updatedItems.splice(index, 1);
        setTemporaryItems(updatedItems);
    }

    const addItemOrder = async (orderId: number, item: ItemOrder) => {
        if (!orderId) {
            toast({
                position: 'top',
                title: 'Error',
                description: 'Por favor, complete todos los campos obligatorios.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        try {
            const resp = await axios.post('/api/itemorder', {
                IdOrder: orderId,
                IdPa: item.IdPa,
                IdService: item.IdService,
                ItemStatus: item.ItemStatus,
            });

            if (resp && resp.data) {
                console.log('addItemOrder->resp.data: ', resp.data);
            }
        } catch (error) {
            console.error('Error al agregar el ítem a la orden:', error);
        }
    }

    const HandleChangeOrder = (e: ChangeEvent<HTMLInputElement>) =>
        setOrder(prevState => ({ ...prevState, [e.target.name]: e.target.value }))

    const HandleChangeItemOrder = (e: ChangeEvent<HTMLInputElement>) =>
        setItemOrder(prevState => ({ ...prevState, [e.target.name]: e.target.value }))

    const loadDiagnoses = async (inputValue: string) => {
        try {
            const response = await axios.get('/api/diagnoseSelect', {
                params: {
                    searchTerm: inputValue,
                },
            });
            const options = response.data.map((diagnose: Diagnose) => ({
                value: diagnose.Id,
                label: `${diagnose.CodDiagnosis} - ${diagnose.NameDiagnosis}`,
            }));
            return options;
        } catch (error) {
            console.error('Error loading diagnoses:', error);
            return [];
        }
    }
    const loadMedical = async (inputValue: string) => {
        try {
            const response = await axios.get('/api/medicalSelect', {
                params: {
                    searchTerm: inputValue,
                },
            });
            const options = response.data.map((medical: Medical) => ({
                value: medical.Id,
                label: `${medical.NameMedical}`,
            }));
            return options;
        } catch (error) {
            console.error('Error loading medical:', error);
            return [];
        }
    }

    const loadService = async (inputValue: string) => {
        try {
            const response = await axios.get('/api/serviceSelect', {
                params: {
                    searchTerm: inputValue,
                    fromAsyncSelect: true
                },
            });
            const options = response.data.map((service: Service) => ({
                value: service.Id,
                label: `${service.CodService} - ${service.NameService}`,
            }));
            return options;
        } catch (error) {
            console.error('Error loading service:', error);
            return [];
        }
    }


    const loadPatient = async (inputValue: string) => {
        try {
            const response = await axios.get('/api/patient', {
                params: {
                    searchTerm: inputValue,
                },
            });
            const options = response.data.patients.map((patient: Patient) => ({
                value: patient.Id,
                label: `${patient.IdPa} - ${patient.FirstName} ${patient.SecondName} ${patient.FirstSurname} ${patient.SecondSurname}`,
            }));
            fetchLatestOrder()
            fetchItemOrders()
            return options;
        } catch (error) {
            console.error('Error loading patient:', error);
            return [];
        }
    }

    const [page, setPage] = useState(1);
    const [pageSize] = useState(1);
    const [latestOrder, setLatestOrder] = useState<Order | null>(null);
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<{ value: number; label: string } | null>(null);
    const [selectedMedical, setSelectedMedical] = useState<{ value: number; label: string } | null>(null)
    const [hasMoreOrders, setHasMoreOrders] = useState(true);

    const generatePDF = () => {
        if (latestOrder) {
            const doc = new jsPDF();

            const addHeader = (doc: any) => {
                const image = new Image();
                image.src = biomedicalImage.src;
                doc.addImage(image, 'PNG', 10, 8, 37.5, 12.5);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text(`Clinica Piedecuesta S.a`, 48, 10, { align: 'left' });
                doc.setFont('helvetica', 'normal');
                doc.text(`NIT: 800090749-4`, 48, 14, { align: 'left' });
                doc.text(`TEF: 6076540401`, 90, 14, { align: 'left' });
                doc.text(`DIR: San Rafael, Cra. 11 #6-48, Piedecuesta `, 130, 20, { align: 'left' });
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`ORDEN MEDICA No. ${latestOrder.Id}`, 130, 10, { align: 'left' });
                doc.setFont('helvetica', 'normal');
                doc.text(`Fecha de Orden: ${formatearFecha(latestOrder.DateOrder)} `, 130, 15);
            }

            const addFooter = (doc: any) => {
                const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
                doc.setFontSize(10);
                doc.text(`Página ${currentPage}`, 195, doc.internal.pageSize.height - 10, { align: 'right' });
            };

            doc.internal.pages.forEach((pageNumber) => {
                doc.setPage(pageNumber + 1); // Establecer la página actual
                addHeader(doc); // Agregar encabezado en cada página
                addFooter(doc); // Agregar pie de página en cada página
            });

            doc.setFontSize(12);
            doc.text(`Paciente: `, 10, 32);
            doc.text(`${selectedPatient?.IdPa} ${selectedPatient?.FirstName} ${selectedPatient?.SecondName} ${selectedPatient?.FirstSurname} ${selectedPatient?.SecondSurname}`, 35, 32);

            doc.text(`Nacimiento: `, 10, 38);
            doc.text(`${formatDate(selectedPatient?.BirthDate)} ${calcularEdad(selectedPatient?.BirthDate)} Años `, 35, 38);

            doc.text(`Medico: `, 10, 44);
            doc.text(`${latestOrder.Medical?.NameMedical} `, 35, 44);

            doc.text(`Diagnostico: `, 10, 50);
            doc.text(`${latestOrder.Diagnose?.CodDiagnosis} ${latestOrder.Diagnose?.NameDiagnosis} `, 35, 50);


            // Línea divisoria
            doc.line(10, 55, 200, 55);

            // Título de los elementos
            doc.setFontSize(14);
            doc.text('Items:', 10, 65);

            let yPosition = 75;
            let totalPages = 1

            doc.setFontSize(12);
            itemOrders.forEach((order) => {
                const serviceText = `${order.Service?.CodService} - ${order.Service?.NameService}`;

                const lineHeight = 12 / doc.internal.scaleFactor;
                const lines = doc.splitTextToSize(serviceText, 180);
                const totalHeight = lines.length * lineHeight;
                if (yPosition + lineHeight > 250) {
                    // Cambiar a una nueva página
                    doc.addPage();
                    yPosition = 35;
                    addHeader(doc)
                    addFooter(doc)
                    doc.setFontSize(12);
                    totalPages++;

                }

                lines.forEach((line: string | string[]) => {
                    doc.text(line, 10, yPosition);
                    yPosition += lineHeight;
                });

                yPosition += 5;


            });

            if (totalPages >= 1) {
                doc.setFontSize(9);
                doc.text(`${latestOrder.Medical?.Specialty}: ${latestOrder.Medical?.NameMedical}  Reg. Medico: ${latestOrder.Medical?.RegMedical}`, 200, yPosition, { align: 'right' });
                doc.save('orden.pdf');
            }

        } else {
            toast({
                position: 'top',
                title: 'Error',
                description: 'No hay una orden para generar el PDF.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleStatusChange = async () => {
        if (latestOrder && latestOrder.ItemOrder) {
            try {
                const updatedOrder = {
                    Id: latestOrder.Id,
                    IdPa: latestOrder.IdPa,
                    DateOrder: latestOrder.DateOrder,
                    OrderStatus: 1 - latestOrder.OrderStatus,
                    IdDiagnosis: latestOrder.IdDiagnosis,
                    IdMedical: latestOrder.IdMedical,
                }
                console.log(`/api/order?patientId=${order.IdPa}&page=${page}&pageSize=${pageSize}`, updatedOrder);
                const resp = await axios.put(`/api/order?patientId=${selectedPatient?.Id}&page=${page}&pageSize=${pageSize}`, updatedOrder);

                const itemOrderUpdates = latestOrder.ItemOrder.map((itemOrder) => {
                    return {
                        Id: itemOrder.Id,
                        IdOrder: itemOrder.IdOrder,
                        IdPa: itemOrder.IdPa,
                        IdService: itemOrder.IdService,
                        ItemStatus: 1 - itemOrder.ItemStatus,
                    };
                });

                const updateItemOrderPromises = itemOrderUpdates.map(async (itemOrderUpdate) => {
                    await axios.put(`/api/itemorder?orderId=${latestOrder.Id}`, itemOrderUpdate);
                });
                await Promise.all(updateItemOrderPromises);

                if (resp && resp.data) {
                    setLatestOrder(resp.data);
                }
            } catch (error) {
                console.error('Error al cambiar el estado de la orden:', error);
            }
        }
    };

    const NewOrder = () => {
        setLatestOrder(null);
        setSelectedDiagnosis(null);
        setSelectedMedical(null)
        setOrder(prevOrder => ({ ...prevOrder, Id: 0, DateOrder: new Date() }));
    }

    const fetchLatestOrder = async () => {
        try {
            console.log(`/api/order?patientId=${order.IdPa}&page=${page}&pageSize=${pageSize}`)
            const response = await axios.get(`/api/order?patientId=${selectedPatient?.Id}&page=${page}&pageSize=${pageSize}`);
            if (response.data.orders && response.data.orders.length > 0) {
                const lastOrder = response.data.orders[0];
                const totalOrders = response.data.totalOrders;
                setLatestOrder(lastOrder);
                setOrder(lastOrder);
                setSelectedDiagnosisId(lastOrder);
                setHasMoreOrders(true)
                setSelectedDiagnosis({
                    value: lastOrder.IdDiagnosis,
                    label: `${lastOrder.Diagnose.CodDiagnosis} - ${lastOrder.Diagnose.NameDiagnosis}`
                });
                setSelectedMedical({
                    value: lastOrder.IdMedical,
                    label: `${lastOrder.Medical.NameMedical}`
                });
                if (totalOrders === page) {
                    setHasMoreOrders(false)
                } else {
                    setHasMoreOrders(true);
                }
            } else {
                setHasMoreOrders(false)
                NewOrder()
            }
        } catch (error) {
            console.error('Error loading latest order:', error);
        }
    };

    const fetchItemOrders = async () => {
        try {
            const res = await axios.get(`/api/order?patientId=${selectedPatient?.Id}&page=${page}&pageSize=${pageSize}`);
            const lastOrder = res.data.orders[0];
            if (lastOrder) {
                const response = await axios.get(`/api/itemorder?orderId=${lastOrder.Id}`);
                if (response.data && response.data.length > 0) {

                    setItemOrders(response.data);
                } else {
                    setItemOrders([]);
                    console.log('El paciente no tiene itemOrders.');
                }
            } else {
                setItemOrders([]);
                console.log('No se encontró ninguna orden para el paciente.');

            }
        } catch (error) {
            console.error('Error loading patient orders:', error);
        }
    };

    useEffect(() => {
        fetchLatestOrder();
        fetchItemOrders();
        console.log(selectedPatient?.BirthDate)

        const fetchServices = async () => {
            try {
                const response = await axios.get('/api/serviceSelect');
                if (response.data) {
                    setServices(response.data);
                }
            } catch (error) {
                console.error('Error loading services:', error);
            }
        };
        fetchServices();


        ResetOrder();
        setMethod('verorden')


    }, [page, pageSize, selectedPatientId]);

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const handleNextPage = () => {
        setPage(page + 1);
    };


    if (status === 'unauthenticated') {
        replace('/')
    }

    const handleViewOrder = () => {
        setSelectedPatientId(0);
        setMethod('verorden')
        setSelectedPatient(null)
        setPage(1)
        NewOrder()
    };


    return (
        <>
            <Box px={10}>
                {method === 'verorden' && (
                    <Box pb={10}>

                        <Text>Escoja a un Paciente</Text>

                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={(inputValue) => loadPatient(inputValue)}
                            placeholder="Selecciona un Paciente"
                            onChange={async (selectedOption: { value: number; label: string } | null) => {
                                if (selectedOption) {
                                    try {
                                        const response = await axios.get(`/api/patient?PatientId=${selectedOption.value}`);
                                        const selectedPatientData = response.data[0];
                                        setSelectedPatient(selectedPatientData);
                                        setSelectedPatientId(selectedOption.value);
                                        setPage(1)
                                        console.log(`${selectedOption.value}`)

                                    } catch (error) {
                                        console.error('Error al obtener los datos del paciente:', error);
                                    }
                                } else {
                                    setSelectedPatient(null);
                                    setSelectedPatientId(0);
                                    setPage(1)
                                }
                            }}
                        /></Box>
                )}

                <Grid
                    templateColumns='repeat(7, 1fr)'
                    gap={6}>
                    {selectedPatient?.FirstName && (
                        <GridItem colSpan={1} >
                            <Text as='b' px={2}>
                                Nombres</Text>
                            <Card bg='gray.100' p={2}>
                                <Text fontSize="l" >
                                    {selectedPatient?.FirstName} {selectedPatient?.SecondName}
                                </Text></Card></GridItem>
                    )}

                    {selectedPatient?.FirstSurname && (
                        <GridItem colSpan={1} >
                            <Text as='b' px={2}>
                                Apellidos</Text>
                            <Card bg='gray.100' p={2}>
                                <Text fontSize="l" >
                                    {selectedPatient?.FirstSurname} {selectedPatient?.SecondSurname}
                                </Text></Card></GridItem>
                    )}
                    {selectedPatient?.BirthDate && (
                        <GridItem colSpan={1} >
                            <Text as='b' px={2}>
                                Fecha de nacimiento</Text>
                            <Card bg='gray.100' p={2}>
                                <Text fontSize="l" >
                                    {formatDate(selectedPatient?.BirthDate)}
                                </Text></Card></GridItem>
                    )}

                    {selectedPatient?.IdPa && (
                        <GridItem colSpan={1} >
                            <Text as='b' px={2}>
                                Identificacion</Text>
                            <Card bg='gray.100' p={2}>
                                <Text fontSize="l" >
                                    {selectedPatient?.IdPa}
                                </Text></Card></GridItem>
                    )}

                    {selectedPatient?.Sex && (
                        <GridItem colSpan={1} px={2}>
                            <Text as='b' px={2}>
                                Sexo</Text>
                            <Card bg='gray.100' p={2}>
                                <Text fontSize="l" >
                                    {selectedPatient?.Sex === 'M' ? 'Masculino' : 'Femenino'}
                                </Text></Card></GridItem>
                    )}

                    {latestOrder?.Id && (
                        <GridItem colSpan={1} px={2}>
                            <Text as='b' px={2}>
                                Numero de Orden</Text>
                            <Card bg='gray.100' p={2}>
                                <Text fontSize="l" >
                                    {latestOrder?.Id}
                                </Text></Card></GridItem>
                    )}
                    <GridItem colSpan={1} px={2}>
                        {latestOrder?.Id && (<>   <Text as='b' px={2}>
                            Estado de la Orden</Text> <Card bg={latestOrder?.OrderStatus === 1 ? 'green ' : 'Red'} p={2}> <Text color={'white'}>{latestOrder?.OrderStatus === 1 ? 'Activa' : 'Cancelada'}</Text></Card> </>)}
                    </GridItem>
                </Grid>
                <Box p={6} />
                <Grid
                    templateColumns='repeat(6, 1fr)'
                    gap={6}>
                    <Input focusBorderColor='lime' onChange={HandleChangeOrder} placeholder="Identificacion " variant='filled' name="IdPa" value={selectedPatient?.Id} display='none' />
                    <Switch
                        display='none'
                        colorScheme="teal"
                        size="lg"
                        isChecked={orderStatus === 1}
                        onChange={() => setOrderStatus(orderStatus === 1 ? 0 : 1)}
                    />
                    {selectedPatient?.Id && (
                        <>
                            <GridItem colSpan={2}> <Text px={2} pb={3} >Fecha de la orden *</Text><Input focusBorderColor='lime' onChange={HandleChangeOrder} variant='filled' type='datetime-local' name="DateOrder" value={formatDateTime(order.DateOrder)} /></GridItem>
                            <GridItem colSpan={2}>
                                <Text px={2} pb={3} >Seleccione un diagnóstico *</Text>
                                <AsyncSelect
                                    defaultOptions
                                    loadOptions={(inputValue) => loadDiagnoses(inputValue)}
                                    placeholder="Seleccione un diagnóstico"
                                    onChange={(selectedOption) => {
                                        if (selectedOption) {
                                            setSelectedDiagnosis(selectedOption);
                                            setSelectedDiagnosisId(selectedOption.value);
                                        }
                                    }}
                                    value={selectedDiagnosis}
                                /></GridItem>
                            <GridItem colSpan={2}>
                                <Text px={2} pb={3} >Seleccione un Medico *</Text>
                                <AsyncSelect
                                    defaultOptions
                                    loadOptions={(inputValue) => loadMedical(inputValue)}
                                    placeholder="Seleccione un Medico"
                                    value={selectedMedical}
                                    onChange={(selectedOption) => {
                                        if (selectedOption) {
                                            setSelectedMedical(selectedOption);
                                            setSelectedMedicalId(selectedOption.value);
                                        }
                                    }}
                                /></GridItem>
                        </>
                    )}

                    <Input focusBorderColor='lime' onChange={HandleChangeItemOrder} variant='filled' name="IdOrder" value={(orderId)} display='none' />
                    <Input focusBorderColor='lime' onChange={HandleChangeItemOrder} variant='filled' name="IdPa" value={selectedPatient?.Id} display='none' />

                    {method === 'verorden' && latestOrder?.Id && (
                        <>
                            <GridItem colSpan={6}>  <Text fontSize="xl">Items</Text></GridItem>
                            <GridItem colSpan={6}>
                                <TableContainer>
                                    <Table >
                                        <Thead>
                                            <Tr>
                                                <Th>Id Item</Th>
                                                <Th>Servicio</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {itemOrders.map((order: ItemOrder) => (
                                                <Tr key={order.Id}>
                                                    <Td>{order.Id}</Td>
                                                    <Td>{order.Service?.CodService} - {order.Service?.NameService}</Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </GridItem>
                        </>
                    )}

                    {method === 'verorden' && selectedPatientId !== 0 && (
                        <Box
                            position="fixed"
                            bottom={5}
                            right={5}
                            display="flex"
                            flexDirection="row-reverse"
                            zIndex={1}
                        >
                            <Button colorScheme='teal' mr={3} onClick={() => { NewOrder(), setMethod('crearorden') }} >
                                Crear orden
                            </Button></Box>
                    )}



                    {latestOrder?.Id && (
                        <>
                            <Box position="fixed" bottom="0" left="0" width="100%" p={4} >
                                <Center>
                                    <Box mx={2}>
                                        <Button onClick={handleNextPage} isDisabled={!hasMoreOrders} colorScheme='teal'>
                                            <HiArrowNarrowLeft />
                                        </Button>
                                    </Box>
                                    <Box mx={2}>
                                        <Button onClick={handlePrevPage} isDisabled={page <= 1} colorScheme='teal'>
                                            <HiArrowNarrowRight />
                                        </Button>
                                    </Box>
                                </Center>
                            </Box>
                            <Box position="fixed" bottom="0" left="0" width="60" p={4}>
                                <Button onClick={generatePDF} colorScheme='red'><HiDocumentDownload /></Button>
                            </Box>
                            {method === 'verorden' && latestOrder?.OrderStatus === 1 && (
                                <Box position="fixed" bottom="0" left="20" width="60" p={4}>
                                    <Button colorScheme='blue' onClick={() => onOpenDelete()}>
                                        <HiTrash />
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}

                    {method === 'crearorden' && (
                        <>
                            <Box
                                position="fixed"
                                bottom={4}
                                right={4}
                                display="flex"
                                flexDirection="row-reverse"
                            >
                                <Button colorScheme='teal' mr={3} onClick={(e) => {
                                    addOrder(e)
                                }}>
                                    guardar
                                </Button>
                                <Button colorScheme='teal' mr={3} onClick={() => {
                                    handleViewOrder()
                                }}>
                                    ver ordenes
                                </Button></Box></>)}

                    {method === 'crearorden' && (
                        <>
                            <GridItem colSpan={6}>  <Text fontSize="xl">Items</Text></GridItem>
                            <GridItem colSpan={5}>
                                Codigo del Servicio *
                                <AsyncSelect
                                    cacheOptions
                                    defaultOptions
                                    loadOptions={(inputValue) => loadService(inputValue)}
                                    placeholder="Selecciona un Servicio"
                                    onChange={(selectedOption: { value: number; label: string } | null) => {
                                        if (selectedOption) {
                                            setSelectedServiceId(selectedOption.value);
                                        } else {
                                            setSelectedServiceId(0);
                                        }
                                    }}
                                />
                            </GridItem>
                            <Switch
                                display='none'
                                colorScheme="teal"
                                size="lg"
                                isChecked={itemStatus === 1}
                                onChange={() => setItemStatus(itemStatus === 1 ? 0 : 1)}
                            />
                            <Box pt="6" >
                                <Button left="20" width="20%" colorScheme="teal" onClick={addTemporaryItem}> <HiPlus /></Button></Box>
                            <GridItem colSpan={6}>
                                <TableContainer>
                                    <Table variant='simple'>
                                        <Thead>
                                            <Tr>
                                                <Th>Servicio</Th>
                                                <Th></Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {temporaryItems.map((item: ItemOrder, index: number) => {
                                                const service = services.find(service => service.Id === item.IdService);
                                                const displayText = service ? `${service.CodService} - ${service.NameService}` : 'Servicio no encontrado'
                                                return (
                                                    <Tr key={item.Id}>
                                                        <Td>{displayText}</Td>
                                                        <Td><button onClick={() => handleDeleteItem(index)}><HiTrash className="text-2xl text-red-600" /></button></Td>
                                                    </Tr>
                                                );
                                            })}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </GridItem>
                        </>
                    )}
                </Grid>
            </Box>

            <Modal isOpen={isOpenDelete} onClose={onCloseDelete} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Eliminar Orden</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        ¿Estas seguro que quieres eliminar esta orden?
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='teal' mr={3} onClick={onCloseDelete}>
                            Cerrar
                        </Button>
                        <Button colorScheme='red' onClick={() => { handleStatusChange(), onCloseDelete() }}>
                            Eliminar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}