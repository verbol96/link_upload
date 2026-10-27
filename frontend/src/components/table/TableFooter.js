export const TableFooter = ({ filteredOrders, activeFilters = {} }) => {
    const countedOrders = filteredOrders.filter(el => ![0, 7, 8].includes(Number(el.status)))
    const filters = [
        { label: 'glossy', active: activeFilters.glossy, match: photo => photo.paper === 'glossy' },
        { label: 'lustre', active: activeFilters.lustre, match: photo => photo.paper === 'lustre' },
        { label: 'holst', active: activeFilters.holst, match: photo => photo.type === 'holst' },
        { label: 'magnit', active: activeFilters.magnit, match: photo => photo.type === 'magnit' },
        { label: 'A4', active: activeFilters.A4, match: photo => photo.format === 'а4' || photo.format === '<а4' },
        { label: 'poster', active: activeFilters.poster, match: photo => photo.type === 'poster' }
    ]
    const selected = filters.filter(filter => filter.active)
    const sumPrice = countedOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0)
    const sumFormat = countedOrders.reduce((sum, order) => sum + (order.photos || []).reduce((total, photo) => total + (Number(photo.amount) || 0) * (Number(photo.copies) || 0), 0), 0)
    const countMatching = match => countedOrders.reduce((sum, order) => sum + (order.photos || []).reduce((total, photo) => total + (match(photo) ? (Number(photo.amount) || 0) * (Number(photo.copies) || 0) : 0), 0), 0)
    return (
        <div className="bg-teal-950/70 rounded-md text-xs text-white font-light my-4 flex items-center justify-between px-[10px] py-1 pl-[5%] pr-[10%]">
            <div>N={countedOrders.length}</div>
            {selected.length ? (
                <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1">
                    {selected.map(filter => <span key={filter.label}>{filter.label} = {countMatching(filter.match)}шт</span>)}
                </div>
            ) : (
                <div className="flex items-center gap-6">
                    <div>{sumFormat}шт</div>
                    <div>{sumPrice.toFixed(2)}р</div>
                </div>
            )}
        </div>
    )
}
