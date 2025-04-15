/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ChangeEvent, FC, SyntheticEvent, useEffect, useState } from "react";
import React from "react";
import { Medical, Results, Service } from "@prisma/client";
import {
  useToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Grid,
  GridItem,
  Box,
  Center,
  Card,
  useDisclosure,
  Select,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react";
import AsyncSelect from "react-select/async";
import {
  HiArrowNarrowLeft,
  HiArrowNarrowRight,
  HiDocumentDownload,
  HiPlus,
  HiTrash,
} from "react-icons/hi";
import {
  calcularEdad,
  formatDate,
  formatDateTime,
  formatDateTimeColumn,
  formatearFecha,
} from "@/app/utils/dateUtils";
import {
  Administrator,
  Contract,
  Diagnose,
  ItemOrder,
  Order,
  Patient,
} from "@/app/types/api";
import biomedicalImage from "src/app/assets/biomedical.png";
import { PiReadCvLogoFill } from "react-icons/pi";
import { TfiAlert } from "react-icons/tfi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  setOrder: React.Dispatch<React.SetStateAction<Order>>;
  itemOrder: ItemOrder;
  setItemOrder: React.Dispatch<React.SetStateAction<ItemOrder>>;
  IdPa: number;
  patients: Patient[];
}

const CreateOrderModal: FC<Props> = ({
  isOpen,
  onClose,
  order,
  setOrder,
  itemOrder,
  setItemOrder,
  IdPa,
  patients,
}) => {
  const ResetOrder = () => {
    setSelectedDiagnosisId(0);
    setSelectedMedicalId(0);
    setOrder((prevState) => ({
      ...prevState,
      Id: 0,
      DateOrder: new Date(),
      Care: "",
      Observation: "",
      OrderStatus: "Activa",
      NumIncome: "",
    }));
  };
  
  const [selectedIndex, setSelectedIndex] = useState(undefined);
  const [method, setMethod] = useState<string>("");
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number>(0);
  const [selectedMedicalId, setSelectedMedicalId] = useState<number>(0);
  const [selectedAdminId, setSelectedAdminId] = useState<number>(0);
  const [selectedContractId, setSelectedContractId] = useState<number>(0);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(0);
  const [selectedCare, setSelectedCare] = useState("");
  const [temporaryItems, setTemporaryItems] = useState<ItemOrder[]>([]);
  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete,
  } = useDisclosure();
  const [itemOrders, setItemOrders] = useState<ItemOrder[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const toast = useToast();
  const [orderId, setOrderId] = useState<number>(0);
  const [result, setResults] = useState<Results[]>([]);

  const addOrder = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (
      !selectedDiagnosisId ||
      !selectedMedicalId ||
      !order.DateOrder ||
      !selectedAdminId ||
      !selectedCare ||
      !selectedContractId ||
      !order.NumIncome ||
      !/^\d{10}$/.test(order.NumIncome) ||
      !order.Observation
    ) {
      toast({
        position: "top",
        title: "Error",
        description: "Por favor, complete todos los campos obligatorios.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (temporaryItems.length === 0) {
      toast({
        position: "top",
        title: "Error",
        description:
          "Por favor, añade al menos un ítem a la orden antes de guardar.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      const resp = await axios.post("/api/order", {
        IdPa: order.IdPa,
        DateOrder: order.DateOrder,
        Care: selectedCare,
        Observation: order.Observation,
        OrderStatus: "Activa",
        IdDiagnosis: selectedDiagnosisId,
        IdMedical: selectedMedicalId,
        IdAdministrator: selectedAdminId,
        IdContract: selectedContractId,
        NumIncome: order.NumIncome,
      });
      if (resp && resp.data) {
        const newOrderId = resp.data.Id;

        setOrderId(newOrderId);
        setLatestOrder(resp.data);
        setMethod("verorden");
        setPage(1);
        await Promise.all(
          temporaryItems.map(async (item) => {
            await addItemOrder(newOrderId, item);
          })
        );
        setTemporaryItems([]);
        fetchLatestOrder();
        fetchItemOrders();

        const response = await axios.get(
          `/api/order?patientId=${order.IdPa}&page=${page}&pageSize=${pageSize}`
        );
        const totalOrders = response.data.totalOrders;
        if (totalOrders > page) {
          setHasMoreOrders(true);
        }
      }
    } catch (error) {
      console.error("Error al crear la orden:", error);
    }
  };

  const addTemporaryItem = () => {
    if (selectedServiceId === 0) {
      toast({
        position: "top",
        title: "Error",
        description:
          "Por favor, selecciona un servicio antes de agregar un ítem.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const isServiceAlreadyAdded = temporaryItems.some(
      (item) => item.IdService === selectedServiceId
    );

    if (isServiceAlreadyAdded) {
      toast({
        position: "top",
        title: "Error",
        description: "Este servicio ya ha sido añadido a la orden.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const newItem: ItemOrder = {
      Id: temporaryItems.length + 1,
      IdOrder: orderId,
      IdPa: itemOrder.IdPa,
      IdService: selectedServiceId,
      ItemStatus: 1,
    };
    setTemporaryItems([...temporaryItems, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = [...temporaryItems];
    updatedItems.splice(index, 1);
    setTemporaryItems(updatedItems);
  };

  const addItemOrder = async (orderId: number, item: ItemOrder) => {
    if (!orderId) {
      toast({
        position: "top",
        title: "Error",
        description: "Por favor, complete todos los campos obligatorios.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      const resp = await axios.post("/api/itemorder", {
        IdOrder: orderId,
        IdPa: item.IdPa,
        IdService: item.IdService,
        ItemStatus: item.ItemStatus,
      });
    } catch (error) {
      console.error("Error al agregar el ítem a la orden:", error);
    }
  };

  const HandleChangeOrder = (e: ChangeEvent<HTMLInputElement>) =>
    setOrder((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

  const HandleChangeItemOrder = (e: ChangeEvent<HTMLInputElement>) =>
    setItemOrder((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

  const loadDiagnoses = async (inputValue: string) => {
    try {
      const response = await axios.get("/api/diagnoseSelect", {
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
      console.error("Error loading diagnoses:", error);
      return [];
    }
  };
  const loadMedical = async (inputValue: string) => {
    try {
      const response = await axios.get("/api/medicalSelect", {
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
      console.error("Error loading medical:", error);
      return [];
    }
  };

  const loadService = async (inputValue: string) => {
    try {
      const response = await axios.get("/api/serviceSelect", {
        params: {
          searchTerm: inputValue,
          fromAsyncSelect: true,
        },
      });
      const options = response.data.map((service: Service) => ({
        value: service.Id,
        label: `${service.CodService} - ${service.NameService}`,
      }));
      return options;
    } catch (error) {
      console.error("Error loading service:", error);
      return [];
    }
  };

  const loadAdmin = async (inputValue: string) => {
    try {
      const response = await axios.get("/api/adminSelect", {
        params: {
          searchTerm: inputValue,
        },
      });
      const options = response.data.map((admin: Administrator) => ({
        value: admin.Id,
        label: `${admin.CodAdmin} - ${admin.NameAdmin}`,
      }));
      return options;
    } catch (error) {
      console.error("Error loading administrator:", error);
      return [];
    }
  };

  const loadContract = async (inputValue: string) => {
    try {
      const response = await axios.get("/api/contractSelect", {
        params: {
          searchTerm: inputValue,
        },
      });
      const options = response.data.map((contract: Contract) => ({
        value: contract.Id,
        label: `${contract.CodContract} - ${contract.CodNume}`,
      }));
      return options;
    } catch (error) {
      console.error("Error loading contract:", error);
      return [];
    }
  };

  const [page, setPage] = useState(1);
  const [pageSize] = useState(1);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [selectedMedical, setSelectedMedical] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [selectedContract, setSelectedContract] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);

  const generatePDF = () => {
    if (latestOrder) {
      const doc = new jsPDF();

      const addHeader = (doc: any) => {
        const image = new Image();
        image.src = biomedicalImage.src;
        doc.addImage(image, "PNG", 10, 8, 37.5, 12.5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`Clinica Piedecuesta S.a`, 48, 10, { align: "left" });
        doc.setFont("helvetica", "normal");
        doc.text(`NIT: 800090749-4`, 48, 14, { align: "left" });
        doc.text(`TEF: 6076540401`, 90, 14, { align: "left" });
        doc.text(`DIR: San Rafael, Cra. 11 #6-48, Piedecuesta `, 130, 20, {
          align: "left",
        });
        doc.text(`NUMERO INGRESO. ${latestOrder.NumIncome} `, 130, 25, {
          align: "left",
        });
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`ORDEN MEDICA No. ${latestOrder.Id}`, 130, 10, {
          align: "left",
        });
        doc.setFont("helvetica", "normal");
        doc.text(
          `Fecha de Orden: ${formatearFecha(latestOrder.DateOrder)} `,
          130,
          15
        );
      };

      const addFooter = (doc: any) => {
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(10);
        doc.text(
          `Página ${currentPage}`,
          195,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      };

      doc.internal.pages.forEach((pageNumber) => {
        doc.setPage(pageNumber + 1); // Establecer la página actual
        addHeader(doc); // Agregar encabezado en cada página
        addFooter(doc); // Agregar pie de página en cada página
      });

      doc.setFontSize(12);
      doc.text(`Paciente: `, 10, 32);
      doc.text(`${identification} ${patientName} ${patientSurname}`, 35, 32);

      doc.text(`Nacimiento: `, 10, 38);
      doc.text(`${birthDate} ${calcularEdad(birthDate)} Años `, 35, 38);

      doc.text(`Medico: `, 10, 44);
      doc.text(`${latestOrder.Medical?.NameMedical} `, 35, 44);

      doc.text(`Admin: `, 10, 50);
      doc.text(
        `${latestOrder.Administrator?.CodAdmin} ${latestOrder.Administrator?.NameAdmin} `,
        35,
        50
      );
      doc.text(`Contrato: `, 10, 56);
      doc.text(
        `${latestOrder.Contract?.CodContract} ${latestOrder.Contract?.CodNume} `,
        35,
        56
      );
      doc.text(`Atencion: `, 10, 62);
      doc.text(
        `${
          latestOrder?.Care === "URG"
            ? "Urgencias"
            : latestOrder?.Care === "HOS"
            ? "Hospitalario"
            : latestOrder?.Care === "AMB"
            ? "Ambulatorio"
            : "nulo"
        }`,
        35,
        62
      );

      doc.text(`Diagnostico: `, 10, 68);
      const diagnosisText = `${latestOrder.Diagnose?.CodDiagnosis} ${latestOrder.Diagnose?.NameDiagnosis}`;
      const diagnosisLines = doc.splitTextToSize(diagnosisText, 180);
      let diagnosisHeight = diagnosisLines.length * 6; // Ajusta el 6 según tus necesidades
      diagnosisLines.forEach((line: any, index: any) => {
        if (index === 0) {
          doc.text(line, 35, 68);
        } else {
          doc.text(line, 10, 68 + index * 6); // Aumenta la posición 'y' en 12 para cada línea adicional
        }
      });

      let yPosition = 90 + diagnosisHeight;

      // Línea divisoria
      doc.line(10, 70 + diagnosisHeight, 200, 70 + diagnosisHeight);

      // Título de los elementos
      doc.setFontSize(14);
      doc.text("Items:", 10, 80 + diagnosisHeight);

      let totalPages = 1;

      doc.setFontSize(12);
      itemOrders.forEach((order) => {
        const serviceText = `${order.Service?.CodService} - ${order.Service?.NameService}`;

        const lineHeight = 12 / doc.internal.scaleFactor;
        const lines = doc.splitTextToSize(serviceText, 180);
        const totalHeight = lines.length * lineHeight;
        if (yPosition + lineHeight > 250) {
          // Cambiar a una nueva página
          doc.addPage();
          yPosition = 32;
          addHeader(doc);
          addFooter(doc);
          doc.setFontSize(12);
          totalPages++;
        }

        lines.forEach((line: string | string[]) => {
          doc.text(line, 10, yPosition);
          yPosition += lineHeight;
        });

        yPosition += 5; // Agregar un espacio entre las líneas

        const resultTableData: any[][] = [];

        // Verificar si Results es un array
        if (Array.isArray(order.Results) && order.Results.length > 0) {
          order.Results?.forEach((result) => {
            resultTableData.push([
              result.Codanalito,
              result.Cuantitati,
              result.Cualitativo,
              result.Ref_min,
              result.Ref_max,
              result.Ref_observ,
              result.Unidades,
              formatDateTimeColumn(result.Fresultado),
            ]);
          });

          //@ts-ignore
          const resultTable = doc.autoTable({
            head: [
              [
                "Cod. Analito",
                "Res. Cuantitativo",
                "Res. Cualitativo",
                "Ref. Minino",
                "Ref. Máximo",
                "Ref. Observacion",
                "Unidades",
                "Fecha y hora resultado",
              ],
            ],
            body: resultTableData,
            startY: yPosition,
            theme: "plain",
            styles: { cellPadding: 2, fontSize: 10, fontStyle: "normal" },
            headStyles: { fontStyle: "bold" },
          });

          yPosition = resultTable.lastAutoTable.finalY + 10;
        }
      });

      if (totalPages >= 1) {
        doc.setFontSize(9);
        doc.text(
          `${latestOrder.Medical?.Specialty}: ${latestOrder.Medical?.NameMedical}  Reg. Medico: ${latestOrder.Medical?.RegMedical}`,
          200,
          yPosition,
          { align: "right" }
        );
        doc.save("orden.pdf");
      }
    } else {
      toast({
        position: "top",
        title: "Error",
        description: "No hay una orden para generar el PDF.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStatusChange = async () => {
    if (latestOrder && latestOrder.ItemOrder) {
      try {
        const body = {
          Id: latestOrder.Id,
          OrderStatus: "Cancelada",
        };
        const resp = await axios.put(
          `/api/order?patientId=${order.IdPa}&page=${page}&pageSize=${pageSize}`,
          body,
          {
            params: {
              stausModicate: true,
            },
          }
        );

        const itemOrderUpdates = latestOrder.ItemOrder.map((itemOrder) => {
          return {
            Id: itemOrder.Id,
            IdOrder: itemOrder.IdOrder,
            IdPa: itemOrder.IdPa,
            IdService: itemOrder.IdService,
            ItemStatus: 0,
            IdLab: itemOrder.IdLab,
          };
        });

        const updateItemOrderPromises = itemOrderUpdates.map(
          async (itemOrderUpdate) => {
            await axios.put(
              `/api/itemorder?orderId=${latestOrder.Id}`,
              itemOrderUpdate
            );
          }
        );
        await Promise.all(updateItemOrderPromises);

        fetchItemOrders();

        itemOrderUpdates.forEach(async (item) => {
          if (item.IdLab !== null) {
            const urllogin =
              "https://labsyncpro-api-ryk3a.ondigitalocean.app/auth/login";
            const headers = {
              accept: "*/*",
              "Content-Type": "application/json",
            };
            const datalogin = {
              email: "laboratorio@miempresalab.com",
              password: "xxxx",
            };

            const response = await axios.post(urllogin, datalogin, { headers });

            try {
              const url = `https://labsyncpro-api-ryk3a.ondigitalocean.app/lab-requests/${item.IdLab}`;
              const headers = {
                accept: "*/*",
                Authorization: `Bearer ${response.data.access_token}`,
                "Content-Type": "application/json",
              };

              const resp = await axios.get(url, { headers });
              const lastLogIndex = resp.data.status_log.length - 1;
              const isLastLogReadBySystem =
                resp.data.status_log[lastLogIndex].status === "REQUESTED";

              if (isLastLogReadBySystem) {
                console.log(resp.data);

                const url = `https://labsyncpro-api-ryk3a.ondigitalocean.app/lab-requests/${item.IdLab}/update-state`;
                const headers = {
                  accept: "*/*",
                  Authorization: `Bearer ${response.data.access_token}`,
                  "Content-Type": "application/json",
                };

                const cancel = await axios.put(
                  url,
                  { status: "CANCELED" },
                  { headers }
                );
              }
            } catch (error: any) {
              toast({
                position: "top",
                title: "error",
                description: `Error al cancelar los item ${item.IdLab}, por favor intente nuevamente. o comuniquese con el administrador:  ${error.message}`,
                status: "error",
                duration: 3000,
                isClosable: true,
              });
            }
          }
        });

        if (resp && resp.data) {
          setLatestOrder(resp.data);
        }
      } catch (error) {
        console.error("Error al cambiar el estado de la orden:", error);
      }
    }
  };

  const NewOrder = () => {
    setLatestOrder(null);
    setSelectedDiagnosis(null);
    setSelectedMedical(null);
    setSelectedAdmin(null);
    setSelectedContract(null);
    setSelectedCare("");
    setOrder((prevOrder) => ({
      ...prevOrder,
      Id: 0,
      DateOrder: new Date(),
      Observation: "",
      NumIncome: "",
    }));
  };

  const fetchLatestOrder = async () => {
    try {
      const response = await axios.get(
        `/api/order?patientId=${order.IdPa}&page=${page}&pageSize=${pageSize}`
      );
      if (response.data.orders && response.data.orders.length > 0) {
        const lastOrder = response.data.orders[0];
        const totalOrders = response.data.totalOrders;
        setLatestOrder(lastOrder);
        setOrder(lastOrder);
        // setSelectedDiagnosisId(lastOrder);
        setHasMoreOrders(true);
        setSelectedDiagnosis({
          value: lastOrder.IdDiagnosis,
          label: `${lastOrder.Diagnose.CodDiagnosis} - ${lastOrder.Diagnose.NameDiagnosis}`,
        });
        setSelectedAdmin({
          value: lastOrder.IdAdministrator,
          label: `${lastOrder.Administrator.CodAdmin} - ${lastOrder.Administrator.NameAdmin}`,
        });
        setSelectedContract({
          value: lastOrder.IdContract,
          label: `${lastOrder.Contract.CodContract} - ${lastOrder.Contract.CodNume}`,
        });
        setSelectedMedical({
          value: lastOrder.IdMedical,
          label: `${lastOrder.Medical.NameMedical}`,
        });
        setSelectedCare(lastOrder.Care);
        if (totalOrders === page) {
          setHasMoreOrders(false);
        } else {
          setHasMoreOrders(true);
        }
      } else {
        setHasMoreOrders(false);
        NewOrder();
      }
    } catch (error) {
      console.error("Error loading latest order:", error);
    }
  };

  const fetchItemOrders = async () => {
    try {
      const res = await axios.get(
        `/api/order?patientId=${order.IdPa}&page=${page}&pageSize=${pageSize}`
      );
      const lastOrder = res.data.orders[0];
      if (lastOrder) {
        const response = await axios.get(
          `/api/itemorder?orderId=${lastOrder.Id}`
        );
        if (response.data && response.data.length > 0) {
          setItemOrders(response.data);
        } else {
          setItemOrders([]);
          console.log("El paciente no tiene itemOrders.");
        }
      } else {
        setItemOrders([]);
        console.log("No se encontró ninguna orden para el paciente.");
      }
    } catch (error) {
      console.error("Error loading patient orders:", error);
    }
  };

  useEffect(() => {
    setResults([]);
    fetchLatestOrder();
    fetchItemOrders();
    infoPatient(IdPa);
    setSelectedIndex(undefined)

    const fetchServices = async () => {
      try {
        const response = await axios.get("/api/serviceSelect");
        if (response.data) {
          setServices(response.data);
        }
      } catch (error) {
        console.error("Error loading services:", error);
      }
    };
    fetchServices();

    if (!isOpen) {
      setPage(1);
      ResetOrder();
      setMethod("verorden");
    }
  }, [page, pageSize, isOpen, order.IdPa]);

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    setSelectedIndex(undefined)
    }
  };

  const handleNextPage = () => {
    setPage(page + 1);
    setSelectedIndex(undefined)
  };

  const [patientName, setPatientName] = useState("");
  const [patientSurname, setPatientSurname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [identification, setIdentification] = useState("");
  const [sex, setSex] = useState("");
  const [typedocu, setTypedocu] = useState("");
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [firstSurname, setFirstSurname] = useState("");
  const [secondSurname, setSecondSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [Email, setEmail] = useState("");

  const infoPatient = (PatientId: number) => {
    const selectedPatient = patients.find((patient) => IdPa === PatientId);
    if (selectedPatient) {
      setPatientName(
        `${selectedPatient.FirstName} ${selectedPatient.SecondName}`
      );
      setPatientSurname(
        `${selectedPatient.FirstSurname} ${selectedPatient.SecondSurname}`
      );
      setBirthDate(`${formatDate(selectedPatient.BirthDate)}`);
      setIdentification(`${selectedPatient.IdPa}`);
      setSex(`${selectedPatient.Sex}`);
      setTypedocu(`${selectedPatient.TipeId}`);
      setFirstName(`${selectedPatient.FirstName}`);
      setSecondName(`${selectedPatient.SecondName}`);
      setFirstSurname(`${selectedPatient.FirstName}`);
      setSecondSurname(`${selectedPatient.SecondSurname}`);
      setPhone(`${selectedPatient.Phone}`);
      setEmail(`${selectedPatient.Email}`);
    }
  };

  const CreateLabrequestDto = async () => {
    // validar el id de la solicutud
    if (!latestOrder?.Id || isNaN(latestOrder?.Id) || latestOrder?.Id <= 0) {
      toast({
        position: "top",
        title: "Error",
        description: "No hay id de la solictud a enviar  ",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const urllogin =
      "https://labsyncpro-api-ryk3a.ondigitalocean.app/auth/login";
    const headers = { accept: "*/*", "Content-Type": "application/json" };
    const datalogin = {
      email: "laboratorio@miempresalab.com",
      password: "xxxx",
    };

    const response = await axios.post(urllogin, datalogin, { headers });

    try {
      const url =
        "https://labsyncpro-api-ryk3a.ondigitalocean.app/lab-requests";
      const headers = {
        accept: "*/*",
        Authorization: `Bearer ${response.data.access_token}`,
        "Content-Type": "application/json",
      };
      const promises = itemOrders.map((item: ItemOrder) => {
        const data = {
          tidocument: typedocu,
          documento: identification,
          apellido1: firstSurname,
          apellido2: secondSurname,
          nombre1: firstName,
          nombre2: secondName,
          sexo:
            sex === "M"
              ? "MASCULINO"
              : sex === "F"
              ? "FEMENINO"
              : "INDETERMINADO",
          nacimiento: birthDate,
          telefono: phone,
          correo: Email,
          codeps: order.Administrator?.CodAdmin,
          nomeps: order.Administrator?.NameAdmin,
          contrato: order.Contract?.CodContract,
          atencion: order.Care,
          codmedico: order.Medical?.CodMedical,
          nommedico: order.Medical?.NameMedical,
          codregimen: order.Contract?.CodRegime,
          nomregimen: order.Contract?.NameRegime,
          observacion: order.Observation,
          codprocedi: item.Service?.CodService,
          nomprocedi: item.Service?.NameService,
          fechasolic: order.DateOrder,
          numorden: latestOrder?.Id,
          numingreso: order.NumIncome,
          organizacion_slug: "hospital-santander-bucaramanaga",
        };

        return axios.post(url, data, { headers });
      });

      if (latestOrder && latestOrder.ItemOrder) {
        try {
          const body = {
            Id: latestOrder.Id,
            OrderStatus: "Enviada a Laborarorio",
          };
          const resp = await axios.put(
            `/api/order?patientId=${order.IdPa}&page=${page}&pageSize=${pageSize}`,
            body,
            {
              params: {
                stausModicate: true,
              },
            }
          );

          if (resp && resp.data) {
            setLatestOrder(resp.data);
          }
        } catch (error) {
          console.error("Error al cambiar el estado de la orden:", error);
        }
      }

      Promise.all(promises).then(async (responses) => {
        responses.forEach((response) => {
          const foundItem = itemOrders.find((item) => {
            const codService = item.Service?.CodService;
            if (!codService) return false;
            return codService === response.data.codprocedi;
          });

          if (foundItem) {
            foundItem["IdLab"] = response.data._id;

            const resp = axios.put(`/api/itemorder?itemId=${foundItem.Id}`, {
              Id: foundItem.Id,
              IdOrder: foundItem.IdOrder,
              IdPa: foundItem.IdPa,
              IdService: foundItem.IdService,
              ItemStatus: foundItem.ItemStatus,
              IdLab: foundItem.IdLab,
            });
          }
        });
        fetchItemOrders();

        toast({
          position: "top",
          title: "success",
          description: "Las solicitudes se enviaron correctamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      });
    } catch (error: any) {
      toast({
        position: "top",
        title: "error",
        description: `Error al enviar la solicitud, por favor intente nuevamente. o comuniquese con el administrador:  ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const ResultsLabrequestDto = async (
    Idlab: string | undefined,
    Status: number,
    Id: number
  ) => {
    const urllogin =
      "https://labsyncpro-api-ryk3a.ondigitalocean.app/auth/login";
    const headers = { accept: "*/*", "Content-Type": "application/json" };
    const datalogin = {
      email: "laboratorio@miempresalab.com",
      password: "xxxx",
    };

    const response = await axios.post(urllogin, datalogin, { headers });
    if (Idlab !== null) {
      try {
        const url = `https://labsyncpro-api-ryk3a.ondigitalocean.app/lab-requests/${Idlab}`;
        const headers = {
          accept: "*/*",
          Authorization: `Bearer ${response.data.access_token}`,
          "Content-Type": "application/json",
        };

        const resp = await axios.get(url, { headers });

        if (
          resp.data.status_log.some(
            (log: { status: string }) => log.status === "READ_BY_SYSTEM"
          )
        ) {
          if (Status === 1) {
            const resultLabCreates = resp.data.results.map((results: any) => {
              return {
                Codanalito: results.codanalito,
                Cuantitati: results.cuantitati,
                Cualitativo: results.cualitativo,
                Ref_min: results.ref_min,
                Ref_max: results.ref_max,
                Ref_observ: results.ref_observ,
                Unidades: results.unidades,
                Fresultado: results.fresultado,
                Profesional_num: results.profesional_num,
                IdItemOrder: Id,
              };
            });

            const updateItemOrderPromises = resultLabCreates.map(
              async (resultLabCreate: any) => {
                await axios.post(`/api/results`, resultLabCreate);
              }
            );
            await Promise.all(updateItemOrderPromises);

            const body = {
              Id: Id,
              ItemStatus: 2,
            };
            axios.put(`/api/itemorder?itemId=${Id}`, body, {
              params: {
                stausModicate: true,
              },
            });
            fetchItemOrders();
            const result = await axios.get(`/api/results?itemId=${Id}`);
            setResults(result.data);
          }
        }
      } catch (error: any) {
        toast({
          position: "top",
          title: "error",
          description: `Error al consultar los resultados, por favor intente nuevamente. o comuniquese con el administrador:  ${error.message}`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const ResultsLocal = async (Id: number) => {
    try {
      const result = await axios.get(`/api/results?itemId=${Id}`);
      setResults(result.data);
    } catch (error: any) {
      toast({
        position: "top",
        title: "error",
        description: `Error al consultar los resultados, por favor intente nuevamente. o comuniquese con el administrador:  ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAccordionChange = (index: any) => {
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Órden Paciente</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              {patientName && (
                <GridItem colSpan={2}>
                  <Text as="b">Nombres</Text>
                  <Card bg="gray.100" p={2}>
                    <Text fontSize="l">{patientName}</Text>
                  </Card>
                </GridItem>
              )}
              {patientSurname && (
                <GridItem colSpan={2}>
                  <Text as="b">Apellidos</Text>
                  <Card bg="gray.100" p={2}>
                    <Text fontSize="l">{patientSurname}</Text>
                  </Card>
                </GridItem>
              )}
              {birthDate && (
                <GridItem colSpan={2}>
                  <Text as="b">Fecha de Nacimiento</Text>
                  <Card bg="gray.100" p={2}>
                    <Text fontSize="l">{birthDate}</Text>
                  </Card>
                </GridItem>
              )}
              {identification && (
                <GridItem colSpan={1}>
                  <Text as="b">Identificacion</Text>
                  <Card bg="gray.100" p={2}>
                    <Text fontSize="l">{identification}</Text>
                  </Card>
                </GridItem>
              )}
              {sex && (
                <GridItem colSpan={1}>
                  <Text as="b">Sexo</Text>
                  <Card bg="gray.100" p={2}>
                    <Text fontSize="l">
                      {sex === "M"
                        ? "MASCULINO"
                        : sex === "F"
                        ? "FEMENINO"
                        : "INDETERMINADO"}
                    </Text>
                  </Card>
                </GridItem>
              )}
              <GridItem colSpan={1}>
                <Text as="b">N.Orden</Text>
                <Card bg="gray.100" p={2}>
                  <Text fontSize="l">{latestOrder?.Id || "Pendiente"}</Text>
                </Card>
              </GridItem>
              <GridItem colSpan={1}>
                <Text as="b">Estado</Text>
                <Card
                  bg={
                    latestOrder?.OrderStatus === "Activa"
                      ? "green"
                      : latestOrder?.OrderStatus === "Cancelada"
                      ? "Red"
                      : latestOrder?.OrderStatus === "Enviada a Laborarorio"
                      ? "blue.500"
                      : "red.800"
                  }
                  p={2}
                >
                  <Text color={"white"} >
                    {latestOrder?.OrderStatus || "Pendiente"}
                  </Text>
                </Card>
              </GridItem>
              <GridItem colSpan={2}>
                <Text as="b">N. Ingreso *</Text>
                <Input
                  focusBorderColor="lime"
                  onChange={HandleChangeOrder}
                  variant="filled"
                  name="NumIncome"
                  value={order.NumIncome}
                  isReadOnly={method === "verorden"}
                />
              </GridItem>
            </Grid>
            <Box p={1} />
            <Grid templateColumns="repeat(6, 1fr)" gap={6}>
              <Input
                focusBorderColor="lime"
                onChange={HandleChangeOrder}
                placeholder="Identificacion "
                variant="filled"
                name="IdPa"
                value={order.IdPa}
                display="none"
              />
              <GridItem colSpan={2}>
                <Text pb={3}>Fecha de la orden *</Text>
                <Input
                  focusBorderColor="lime"
                  onChange={HandleChangeOrder}
                  variant="filled"
                  type="datetime-local"
                  name="DateOrder"
                  value={formatDateTime(order.DateOrder)}
                  isReadOnly
                />
              </GridItem>
              <GridItem colSpan={2}>
                <Text pb={3}>Seleccione un diagnóstico *</Text>
                <AsyncSelect
                  isDisabled={method === "verorden"}
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
                />
              </GridItem>
              <GridItem colSpan={2}>
                <Text pb={3}>Seleccione un Medico *</Text>
                <AsyncSelect
                  isDisabled={method === "verorden"}
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
                />
              </GridItem>
              <GridItem colSpan={2}>
                <Text pb={3}>Seleccione un Administradora *</Text>
                <AsyncSelect
                  isDisabled={method === "verorden"}
                  defaultOptions
                  loadOptions={(inputValue) => loadAdmin(inputValue)}
                  placeholder="Seleccione una Administradora"
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      setSelectedAdmin(selectedOption);
                      setSelectedAdminId(selectedOption.value);
                    }
                  }}
                  value={selectedAdmin}
                />
              </GridItem>
              <GridItem colSpan={2}>
                <Text pb={3}>Seleccione un Contrato *</Text>
                <AsyncSelect
                  isDisabled={method === "verorden"}
                  defaultOptions
                  loadOptions={(inputValue) => loadContract(inputValue)}
                  placeholder="Seleccione una Contrato"
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      setSelectedContract(selectedOption);
                      setSelectedContractId(selectedOption.value);
                    }
                  }}
                  value={selectedContract}
                />
              </GridItem>
              <GridItem colSpan={2}>
                <Text pb={3}>Seleccione un Atencion *</Text>
                <Select
                  placeholder="Seleccione un Atencion"
                  focusBorderColor="lime"
                  variant="filled"
                  value={selectedCare}
                  isDisabled={method === "verorden"}
                  onChange={(e) => setSelectedCare(e.target.value)}
                >
                  <option value="URG">Urgencias</option>
                  <option value="HOS">Hospitalario</option>
                  <option value="AMB">Ambulatorio</option>
                </Select>
              </GridItem>
              <GridItem colSpan={6}>
                <Text pb={3}>Observacion</Text>
                <Input
                  focusBorderColor="lime"
                  onChange={HandleChangeOrder}
                  variant="filled"
                  name="Observation"
                  value={order.Observation}
                  isReadOnly={method === "verorden"}
                />
              </GridItem>
              <GridItem colSpan={6}>
                <Text fontSize="xl">Items</Text>
              </GridItem>
              <Input
                focusBorderColor="lime"
                onChange={HandleChangeItemOrder}
                variant="filled"
                name="IdOrder"
                value={orderId}
                display="none"
              />
              <Input
                focusBorderColor="lime"
                onChange={HandleChangeItemOrder}
                variant="filled"
                name="IdPa"
                value={itemOrder.IdPa}
                display="none"
              />
              {method === "crearorden" && (
                <>
                  <GridItem colSpan={5}>
                    Codigo del Servicio *
                    <AsyncSelect
                      cacheOptions
                      defaultOptions
                      loadOptions={(inputValue) => loadService(inputValue)}
                      placeholder="Selecciona un Servicio"
                      onChange={(
                        selectedOption: { value: number; label: string } | null
                      ) => {
                        if (selectedOption) {
                          setSelectedServiceId(selectedOption.value);
                        } else {
                          setSelectedServiceId(0);
                        }
                      }}
                    />
                  </GridItem>
                  <Box pt="6">
                    <Button
                      left="20"
                      width="20%"
                      colorScheme="teal"
                      onClick={addTemporaryItem}
                    >
                      <HiPlus />
                    </Button>
                  </Box>
                  <GridItem colSpan={6}>
                    <TableContainer>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Servicio</Th>
                            <Th></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {temporaryItems.map(
                            (item: ItemOrder, index: number) => {
                              const service = services.find(
                                (service) => service.Id === item.IdService
                              );
                              const displayText = service
                                ? `${service.CodService} - ${service.NameService}`
                                : "Servicio no encontrado";
                              return (
                                <Tr key={item.Id}>
                                  <Td>{displayText}</Td>
                                  <Td>
                                    <button
                                      onClick={() => handleDeleteItem(index)}
                                    >
                                      <HiTrash className="text-2xl text-red-600" />
                                    </button>
                                  </Td>
                                </Tr>
                              );
                            }
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </GridItem>
                </>
              )}
              {method === "verorden" && (
                <>
                  <GridItem colSpan={6}>
                    <Accordion
                      allowToggle
                      index={selectedIndex}
                      onChange={handleAccordionChange}
                    >
                      <TableContainer>
                        <Table>
                          <Thead>
                            <Tr>
                              <Th>Id Item</Th>
                              <Th>Servicio</Th>
                              <Th>Resultados</Th>
                            </Tr>
                          </Thead>

                          <Tbody>
                            {itemOrders.map((order: ItemOrder, index) => (
                              <>
                                <Tr key={order.Id}>
                                  <Td>{order.Id}</Td>
                                  <Td>
                                    {order.Service?.CodService} -
                                    {order.Service?.NameService}
                                  </Td>
                                  <Td>
                                    <Button
                                      colorScheme="whiteAlpha"
                                      onClick={() => {
                                        ResultsLabrequestDto(
                                          order?.IdLab,
                                          order?.ItemStatus,
                                          order.Id
                                        );
                                        ResultsLocal(order.Id);
                                        handleAccordionChange(index);
                                      }}
                                      isDisabled={
                                        order?.IdLab === null ||
                                        order.ItemStatus === 0
                                      }
                                    >
                                      <PiReadCvLogoFill
                                        color={
                                          order?.ItemStatus === 2
                                            ? "green"
                                            : order?.ItemStatus === 0
                                            ? "red"
                                            : order?.ItemStatus === 1
                                            ? "orange"
                                            : "red.800"
                                        }
                                        size="30px"
                                      />
                                    </Button>
                                  </Td>
                                </Tr>
                                <Tr>
                                  <Th colSpan={3} style={{ width: "33.33%" }}>
                                    <AccordionItem>
                                      <AccordionButton
                                        position="absolute"
                                        top="-9999px"
                                        left="-9999px"
                                      />

                                      <AccordionPanel>
                                        {result.length > 0 ? (
                                          <TableContainer>
                                            <Table size="sm" variant="simple">
                                              <Thead>
                                                <Tr>
                                                  <Th>Cod. analito</Th>
                                                  <Th>Res. cuantitativo</Th>
                                                  <Th>Res. cualitativo</Th>
                                                  <Th>Ref. Minino</Th>
                                                  <Th>Ref. Máximo</Th>
                                                  <Th>Ref. Observacion</Th>
                                                  <Th>Unidades</Th>
                                                  <Th>
                                                    Fecha y hora resultado
                                                  </Th>
                                                </Tr>
                                              </Thead>
                                              <Tbody>
                                                {result.map(
                                                  (result: Results) => (
                                                    <Tr key={result.Id}>
                                                      <Td>
                                                        {result.Codanalito}
                                                      </Td>
                                                      <Td>
                                                        {result.Cuantitati}
                                                      </Td>
                                                      <Td>
                                                        {result.Cualitativo}
                                                      </Td>
                                                      <Td>{result.Ref_min}</Td>
                                                      <Td>{result.Ref_max}</Td>
                                                      <Td>
                                                        {result.Ref_observ}
                                                      </Td>
                                                      <Td>{result.Unidades}</Td>
                                                      <Td>
                                                        {formatDateTimeColumn(
                                                          result.Fresultado
                                                        )}
                                                      </Td>
                                                    </Tr>
                                                  )
                                                )}
                                              </Tbody>
                                            </Table>
                                          </TableContainer>
                                        ) : (
                                          <Center>
                                            <Box>
                                              <Text fontSize="lg">
                                                No hay resultados
                                              </Text>
                                              <Center>
                                                <TfiAlert
                                                  size="50px"
                                                  color="grey"
                                                />
                                              </Center>
                                            </Box>
                                          </Center>
                                        )}
                                      </AccordionPanel>
                                    </AccordionItem>
                                  </Th>
                                </Tr>
                              </>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Accordion>
                  </GridItem>
                </>
              )}
            </Grid>
          </ModalBody>
          <ModalFooter>
            {method === "verorden" && (
              <>
                <Box position="fixed" bottom="0" left="0" width="100%" p={4}>
                  <Center>
                    <Box mx={2}>
                      <Button
                        onClick={handleNextPage}
                        isDisabled={!hasMoreOrders}
                        colorScheme="teal"
                      >
                        <HiArrowNarrowLeft />
                      </Button>
                    </Box>
                    <Box mx={2}>
                      <Button
                        onClick={handlePrevPage}
                        isDisabled={page <= 1}
                        colorScheme="teal"
                      >
                        <HiArrowNarrowRight />
                      </Button>
                    </Box>
                  </Center>
                </Box>
                <Button
                  colorScheme="teal"
                  mr={3}
                  onClick={() => {
                    CreateLabrequestDto();
                  }}
                  isDisabled={
                    latestOrder?.OrderStatus === "Enviada a Laborarorio"
                  }
                >
                  Enviar solicitud
                </Button>
              </>
            )}
            <Button colorScheme="teal" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            {method === "verorden" && (
              <Button
                colorScheme="teal"
                mr={3}
                onClick={() => {
                  NewOrder(), setMethod("crearorden");
                }}
              >
                Crear orden
              </Button>
            )}
            {method === "crearorden" && (
              <Button
                colorScheme="teal"
                mr={3}
                onClick={(e) => {
                  addOrder(e);
                }}
              >
                Guardar
              </Button>
            )}

            {method === "verorden" && (
              <>
                <Box position="fixed" bottom="0" left="0" width="40" p={4}>
                  <Button onClick={generatePDF} colorScheme="red">
                    <HiDocumentDownload />
                  </Button>
                </Box>
                <Box position="fixed" bottom="0" left="20" width="0" p={4}>
                  <Button colorScheme="blue" onClick={() => onOpenDelete()}>
                    <HiTrash />
                  </Button>
                </Box>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenDelete} onClose={onCloseDelete} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Eliminar Orden</ModalHeader>
          <ModalCloseButton />
          <ModalBody>¿Estas seguro que quieres eliminar esta orden?</ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={onCloseDelete}>
              Cerrar
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                handleStatusChange(), onCloseDelete();
              }}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateOrderModal;
