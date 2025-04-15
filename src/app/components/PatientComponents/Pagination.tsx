/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { Box, Button, Center } from "@chakra-ui/react";
import axios from "axios";
import { FC, useEffect, useState } from "react";
import { HiArrowNarrowLeft, HiArrowNarrowRight } from "react-icons/hi";
import React from "react";
import { Patient } from "@prisma/client";

interface Props {
  GetPatients: (startIndex: number, endIndex: number) => void;
  searchTerm: string;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  firstIndex: number;
  lastIndex: number;
  patientPerPage: number;
  setFirstIndex: any;
  setLastIndex: any;
}

const Pagination: FC<Props> = ({
  GetPatients,
  searchTerm,
  setPatients,
  firstIndex,
  lastIndex,
  patientPerPage,
  setFirstIndex,
  setLastIndex,
}) => {
  const [buttonPreviousEnabled, setButtonPreviousEnabled] = useState(false);
  const [buttonNextEnabled, setButtonNextEnabled] = useState(true);

  useEffect(() => {
    setButtonPreviousEnabled(firstIndex > 0);

    const fetchPatients = async () => {
      try {
        const res = await axios.get("/api/patient", {
          params: { searchTerm },
        });
        const totalPatient = res.data.count;
        if (totalPatient <= lastIndex) {
          setButtonNextEnabled(false);
        } else {
          setButtonNextEnabled(true);
        }
      } catch (error) {
        console.error("Error al cargar pacientes:", error);
      }
    };

    fetchPatients();
  }, [firstIndex, lastIndex, patientPerPage, searchTerm]);

  const loadNextPatients = async () => {
    const newFirstIndex = lastIndex;
    const newLatestIndex = lastIndex + patientPerPage;

    try {
      const res = await axios.get("/api/patient", {
        params: {
          searchTerm,
          startIndex: newFirstIndex,
          endIndex: newLatestIndex,
        },
      });
      if (res && res.data.patients) {
        const newPatients = res.data.patients;
        setPatients(newPatients);
        GetPatients(newFirstIndex, newLatestIndex);
        setFirstIndex(newFirstIndex);
        setLastIndex(newLatestIndex);
        setButtonNextEnabled(newPatients.length >= patientPerPage);
      }
    } catch (error) {
      console.error("Error al cargar los siguientes pacientes:", error);
    }
  };

  const loadPatientsPrevious = () => {
    const newFirstIndex = Math.max(firstIndex - patientPerPage, 0);
    const newLatestIndex = newFirstIndex + patientPerPage;
    setButtonNextEnabled(true);
    setButtonPreviousEnabled(newFirstIndex > 0);
    GetPatients(newFirstIndex, newLatestIndex); // Actualiza la paginación en el componente PatientTablet
    setFirstIndex(newFirstIndex);
    setLastIndex(newLatestIndex);
  };
  return (
    <>
      <Box position="fixed" bottom="0" left="0" width="100%" p={4}>
        <Center>
          <Box mx={2}>
            <Button
              colorScheme="teal"
              onClick={loadPatientsPrevious}
              isDisabled={!buttonPreviousEnabled}
            >
              <HiArrowNarrowLeft />
            </Button>
          </Box>
          <Box mx={2}>
            <Button
              colorScheme="teal"
              onClick={loadNextPatients}
              isDisabled={!buttonNextEnabled}
            >
              <HiArrowNarrowRight />
            </Button>
          </Box>
        </Center>
      </Box>
    </>
  );
};
export default Pagination;
