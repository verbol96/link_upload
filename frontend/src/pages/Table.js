
import { TableFull } from "../components/table/TableFull"
import { useState, useRef } from 'react'
import { NavBar } from "../components/admin/NavBar"

const Table = () => {

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [collapsedOrderId, setCollapsedOrderId] = useState(null);
    const [isChanged, setIsChanged] = useState(false);
    const descRowRef = useRef(null);

    const switchingRef = useRef(false);

    const saveBeforeClose = async () => {
        if (!descRowRef.current) return true;

        try {
            await descRowRef.current.saveNow();
            return true;
        } catch (error) {
            console.error('Не удалось сохранить заказ:', error);
            alert('Не удалось сохранить заказ. Проверьте соединение и попробуйте ещё раз.');
            return false;
        }
    };

    const handleDetailsClick = async (orderId) => {
        if (switchingRef.current) return;

        switchingRef.current = true;

        try {
            if (selectedOrder !== null) {
                const saved = await saveBeforeClose();
                if (!saved) return;
            }

            setSelectedOrder(
                orderId === 'save' || selectedOrder === orderId
                    ? null
                    : orderId
            );

            setIsChanged(false);

            if (orderId !== 'save') {
                setCollapsedOrderId(orderId);

                setTimeout(() => {
                    setCollapsedOrderId(null);
                }, 3000);
            }
        } finally {
            switchingRef.current = false;
        }
    };

    const CloseOrder = async () => {
        if (selectedOrder === null || switchingRef.current) return;

        switchingRef.current = true;

        try {
            const saved = await saveBeforeClose();
            if (!saved) return;

            setSelectedOrder(null);
            setIsChanged(false);
        } finally {
            switchingRef.current = false;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FAFBFD]">

            <NavBar />

            {/* Обёртка контента — растягивается на всё доступное место */}
            <div
                className="flex-1 w-full flex justify-center"
                onClick={() => CloseOrder()}
            >
                <div className="w-full md:w-[91.5%]">
                    <TableFull
                        selectedOrder={selectedOrder}
                        setSelectedOrder={setSelectedOrder}
                        collapsedOrderId={collapsedOrderId}
                        setCollapsedOrderId={setCollapsedOrderId}
                        handleDetailsClick={handleDetailsClick}
                        isChanged={isChanged}
                        setIsChanged={setIsChanged}
                        descRowRef={descRowRef}
                    />
                </div>
            </div>
        </div>
    );
};

export default Table;
