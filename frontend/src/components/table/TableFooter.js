export const TableFooter = ({ filteredOrders }) => {

    // Исключаем статусы "в ожидании" (7) и "ошибка" (8)
    const countedOrders = filteredOrders.filter(
        el => ![7, 8].includes(Number(el.status))
    );

    const SumPrice = () => {
        const pr = countedOrders.reduce((sum, el) => {
            return sum + Number(el.price);
        }, 0);

        return pr;
    };

    const SumFormat = () => {
        const pr = countedOrders.reduce((sum, el) => {
            return sum +
                el.photos.reduce((sum1, el1) => {
                    return sum1 + Number(el1.amount) * Number(el1.copies);
                }, 0);
        }, 0);
        return pr;
    };

    return (
        <div className="bg-[#a4aeaf] rounded-[5px]
                        text-[11px] font-medium my-[10px]
                        flex items-center justify-between">
            <div className="flex-grow-[4] basis-0 flex justify-start items-center
                            ml-[9%] min-w-0 px-[10px] py-1">
                N={countedOrders.length}
            </div>
            <div className="flex-grow-[2] basis-0 flex justify-start items-center
                            min-w-0 px-[10px] py-1">
                {SumFormat()}шт
            </div>
            <div className="flex-grow-[1] basis-0 flex justify-start items-center
                            min-w-0 px-[10px] py-1">
                {SumPrice().toFixed(2)}р
            </div>
        </div>
    );
};