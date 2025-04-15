/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useToast } from '@chakra-ui/react';
import axios from 'axios';
import { FC } from 'react';
import React from 'react';

interface Props {
    onDelete: () => void;
    isOpen: boolean
    onClose: () => void;
    patientIdToDelete: string
}

const DeletePatientModal: FC<Props> = ({ isOpen, onClose, patientIdToDelete, onDelete }) => {
    const toast = useToast();

    const handleDelete = async () => {
        try {
                 
            const response = await axios.get(`/api/order?patientId=${patientIdToDelete}`);
            if (response.data.orders && response.data.orders.length > 0) {              
                toast({
                    position: 'top',
                    title: 'Error',
                    description: 'El paciente tiene órdenes asociadas y no puede ser eliminado.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                await axios.delete('/api/patient', {
                    params: { Id: patientIdToDelete },
                });
                onDelete();
            }
        } catch (error) {
      
            console.log(`/api/order?patientId=${patientIdToDelete}`)
        }
        onClose();
    };
    return (
        <>
            <div className='backdrop-blur-sm bg-white/30'>
                <Modal isOpen={isOpen} onClose={onClose} isCentered >
                    <ModalOverlay />
                    <ModalContent >
                        <ModalHeader>Eliminar Paciente</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Text>¿Estás seguro que quieres eliminar este paciente?</Text>
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="teal" mr={3} onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button colorScheme="red" onClick={() => { handleDelete(); onClose(); }}>
                                Eliminar
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </>
    )
}

export default DeletePatientModal;