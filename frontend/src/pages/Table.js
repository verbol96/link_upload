import { TableFull } from "../components/table/TableFull"
import { useState } from 'react'
import Footer from "../components/admin/Footer"
import { NavBar } from "../components/admin/NavBar"

const Table = () => {

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [collapsedOrderId, setCollapsedOrderId] = useState(null);
    const [isChanged, setIsChanged] = useState(false);

    const handleDetailsClick = (orderId) => {
        if (orderId === 'save') {
            setSelectedOrder(null);
            setIsChanged(false);
            return;
        }

        if (selectedOrder === orderId || isChanged) {
            const confirmClose = isChanged ? window.confirm('Закрыть без сохранения?') : true;

            if (confirmClose) {
                setSelectedOrder(selectedOrder === orderId ? null : orderId);
                setIsChanged(selectedOrder === orderId ? null : true);
            }
        } else {
            setSelectedOrder(orderId);
        }

        setCollapsedOrderId(orderId);
        setTimeout(() => {
            setCollapsedOrderId(null);
        }, 3000);
    };

    const CloseOrder = () => {
        if (selectedOrder === null) return;

        if (!isChanged || window.confirm('Закрыть без сохранения?')) {
            setSelectedOrder(null);
            setIsChanged(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-stone-100">

            <NavBar />

            {/* Обёртка контента — растягивается на всё доступное место */}
            <div className="flex-1 w-full flex justify-center" onClick={() => CloseOrder()}>
                <div className="w-full md:w-[91.5%]">
                    <TableFull
                        selectedOrder={selectedOrder}
                        setSelectedOrder={setSelectedOrder}
                        collapsedOrderId={collapsedOrderId}
                        setCollapsedOrderId={setCollapsedOrderId}
                        handleDetailsClick={handleDetailsClick}
                        isChanged={isChanged}
                        setIsChanged={setIsChanged}
                    />
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Table;