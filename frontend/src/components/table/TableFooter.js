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
        <div className="bg-teal-950/70 rounded-md text-xs text-white font-light my-4
                        flex items-center justify-between px-[10px] py-1 pl-[5%] pr-[10%]">

            <div>
                N={countedOrders.length}
            </div>

            <div className="flex items-center gap-6">
                <div>
                    {SumFormat()}шт
                </div>
                <div>
                    {SumPrice().toFixed(2)}р
                </div>
            </div>

        </div>
    );
};