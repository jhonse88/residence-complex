"use client";
import { Box, Button, Center } from "@chakra-ui/react";
import axios from "axios";
import { FC, useEffect, useState } from "react";
import { HiArrowNarrowLeft, HiArrowNarrowRight } from "react-icons/hi";
import React from "react";

interface Props {
  GetData: (startIndex: number, endIndex: number) => void;
  searchTerm: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setData: any;
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

    const fetchContracts = async () => {
      try {
        const res = await axios.get("/api/contracts", {
          params: { searchTerm },
        });
        const totalContracts = res.data.count;
        if (totalContracts <= lastIndex) {
          setButtonNextEnabled(false);
        } else {
          setButtonNextEnabled(true);
        }
      } catch (error) {
        console.error("Error al cargar contratos:", error);
      }
    };

    fetchContracts();
  }, [firstIndex, lastIndex, itemsPerPage, searchTerm]);

  const loadNextItems = async () => {
    const newFirstIndex = lastIndex;
    const newLatestIndex = lastIndex + itemsPerPage;

    try {
      const res = await axios.get("/api/contracts", {
        params: {
          searchTerm,
          skip: newFirstIndex,
          take: itemsPerPage,
        },
      });
      if (res && res.data.contracts) {
        const newContracts = res.data.contracts;
        setData(newContracts);
        GetData(newFirstIndex, newLatestIndex);
        setFirstIndex(newFirstIndex);
        setLastIndex(newLatestIndex);
        setButtonNextEnabled(newContracts.length >= itemsPerPage);
      }
    } catch (error) {
      console.error("Error al cargar los siguientes contratos:", error);
    }
  };

  const loadPreviousItems = async () => {
    const newFirstIndex = Math.max(firstIndex - itemsPerPage, 0);
    const newLatestIndex = newFirstIndex + itemsPerPage;
    
    try {
      const res = await axios.get("/api/contracts", {
        params: {
          searchTerm,
          skip: newFirstIndex,
          take: itemsPerPage,
        },
      });
      if (res && res.data.contracts) {
        const newContracts = res.data.contracts;
        setData(newContracts);
        GetData(newFirstIndex, newLatestIndex);
        setFirstIndex(newFirstIndex);
        setLastIndex(newLatestIndex);
        setButtonPreviousEnabled(newFirstIndex > 0);
        setButtonNextEnabled(true);
      }
    } catch (error) {
      console.error("Error al cargar los contratos anteriores:", error);
    }
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