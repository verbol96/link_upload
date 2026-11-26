export const TableFooter = ({ filteredOrders, activeFilters = {} }) => {
    const countedOrders = filteredOrders.filter(el => ![0, 7, 8].includes(Number(el.status)));
    const filters = [
        { label: 'glossy', active: activeFilters.glossy, match: photo => photo.paper === 'glossy' },
        { label: 'lustre', active: activeFilters.lustre, match: photo => photo.paper === 'lustre' },
        { label: 'holst', active: activeFilters.holst, match: photo => photo.type === 'holst' },
        { label: 'magnit', active: activeFilters.magnit, match: photo => photo.type === 'magnit' },
        { label: 'A4', active: activeFilters.A4, match: photo => photo.format === 'а4' || photo.format === '<а4' },
        { label: 'poster', active: activeFilters.poster, match: photo => photo.type === 'poster' }
    ];
    const selected = filters.filter(filter => filter.active);
    const sumPrice = countedOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);
    const countMatching = (match = () => true) => countedOrders.reduce((sum, order) => sum + (order.photos || []).reduce((total, photo) => total + (match(photo) ? (Number(photo.amount) || 0) * (Number(photo.copies) || 0) : 0), 0), 0);
    return (
        <div className="my-3 flex w-full min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-[#97a8b9] bg-white px-3 py-2.5 text-xs font-medium text-slate-700 shadow-sm">
            <div className="shrink-0 tabular-nums">N={countedOrders.length}</div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:gap-x-6 tabular-nums">
                {selected.length ? selected.map(filter => <span className="whitespace-nowrap" key={filter.label}>{filter.label} = {countMatching(filter.match)}шт</span>) : <><span>{countMatching()}шт</span><span>{sumPrice.toFixed(2)}р</span></>}
            </div>
        </div>
    );
};
