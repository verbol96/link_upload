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
        <div
            className="my-3 flex w-full items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-medium text-slate-700 shadow-sm"
            style={{ border: "1px solid #97a8b9", boxSizing: "border-box" }}
        >
            <div className="shrink-0 tabular-nums">N={countedOrders.length}</div>
            {selected.length ? (
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-6 gap-y-1">
                    {selected.map(filter => <span className="whitespace-nowrap tabular-nums" key={filter.label}>{filter.label} = {countMatching(filter.match)}шт</span>)}
                </div>
            ) : (
                <div className="flex shrink-0 items-center gap-6 tabular-nums">
                    <div>{sumFormat}шт</div>
                    <div>{sumPrice.toFixed(2)}р</div>
                </div>
            )}
        </div>
    )
}
