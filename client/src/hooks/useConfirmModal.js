import { useState } from 'react';

export const useConfirmModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [extraData, setExtraData] = useState(null);

    const openModal = (item, extra = null) => {
        setSelectedItem(item);
        setExtraData(extra);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setSelectedItem(null);
        setExtraData(null);
        };

        return {
        isOpen,
        selectedItem,
        extraData,
        openModal,
        closeModal
        };
    };