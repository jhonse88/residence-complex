"use client";
import { Box, Button, Center } from "@chakra-ui/react";
import axios from "axios";
import { FC, useEffect, useState } from "react";
import { HiArrowNarrowLeft, HiArrowNarrowRight } from "react-icons/hi";
import React from "react";
import { Suppliers } from "@prisma/client";

interface Props {
  GetData: (startIndex: number, endIndex: number) => void;
  searchTerm: string;
  setData: React.Dispatch<React.SetStateAction<Suppliers[]>>;
  firstIndex: number;
  lastIndex: number;
  itemsPerPage: number;
  setFirstIndex: React.Dispatch<React.SetStateAction<number>>;
  setLastIndex: React.Dispatch<React.SetStateAction<number>>;
}

const Pagination: FC<Props> = ({
  GetData,
  searchTerm,
  setData,
  firstIndex,
  lastIndex,
  itemsPerPage,
  setFirstIndex,
  setLastIndex,
}) => {
  const [buttonPreviousEnabled, setButtonPreviousEnabled] = useState(false);
  const [buttonNextEnabled, setButtonNextEnabled] = useState(true);

  useEffect(() => {
    setButtonPreviousEnabled(firstIndex > 0);

    const fetchSuppliers = async () => {
      try {
        const res = await axios.get("/api/suppliers", {
          params: { searchTerm },
        });
        const totalSuppliers = res.data.count;
        if (totalSuppliers <= lastIndex) {
          setButtonNextEnabled(false);
        } else {
          setButtonNextEnabled(true);
        }
      } catch (error) {
        console.error("Error al cargar proveedores:", error);
      }
    };

    fetchSuppliers();
  }, [firstIndex, lastIndex, itemsPerPage, searchTerm]);

  const loadNextItems = async () => {
    const newFirstIndex = lastIndex;
    const newLatestIndex = lastIndex + itemsPerPage;

    try {
      const res = await axios.get("/api/suppliers", {
        params: {
          searchTerm,
          startIndex: newFirstIndex,
          endIndex: newLatestIndex,
        },
      });
      if (res && res.data.suppliers) {
        const newSuppliers = res.data.suppliers;
        setData(newSuppliers);
        GetData(newFirstIndex, newLatestIndex);
        setFirstIndex(newFirstIndex);
        setLastIndex(newLatestIndex);
        setButtonNextEnabled(newSuppliers.length >= itemsPerPage);
      }
    } catch (error) {
      console.error("Error al cargar los siguientes proveedores:", error);
    }
  };

  const loadPreviousItems = () => {
    const newFirstIndex = Math.max(firstIndex - itemsPerPage, 0);
    const newLatestIndex = newFirstIndex + itemsPerPage;
    setButtonNextEnabled(true);
    setButtonPreviousEnabled(newFirstIndex > 0);
    GetData(newFirstIndex, newLatestIndex);
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
              onClick={loadPreviousItems}
              isDisabled={!buttonPreviousEnabled}
            >
              <HiArrowNarrowLeft />
            </Button>
          </Box>
          <Box mx={2}>
            <Button
              colorScheme="teal"
              onClick={loadNextItems}
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