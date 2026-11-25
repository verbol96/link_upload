
import { useRef } from "react"

const clamp = (photo, zoom, x, y) => {
    const rotated = photo.rotation % 180 !== 0
    const width = rotated ? photo.height : photo.width
    const height = rotated ? photo.width : photo.height
    const factor = Math.max(1 / width, 1 / height) * zoom
    const scaledWidth = width * factor
    const scaledHeight = height * factor
    return {
        ...photo,
        zoom,
        x: Math.max((1 - scaledWidth) / 2, Math.min((scaledWidth - 1) / 2, x)),
        y: Math.max((1 - scaledHeight) / 2, Math.min((scaledHeight - 1) / 2, y))
    }
}

const PhotoFrame = ({ photo, onChange, onPick, onSelect, selected, frameIndex, onSwap }) => {
    const pointers = useRef(new Map())
    const gesture = useRef(null)
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
    const center = points => ({
        x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
        y: points.reduce((sum, point) => sum + point.y, 0) / points.length
    })
    const resetGesture = () => {
        const points = [...pointers.current.values()]
        gesture.current = photo && points.length
            ? { points, photo, distance: points.length === 2 ? distance(points[0], points[1]) : 0 }
            : null
    }
    const down = event => {
        if (!photo || event.target.closest("button")) return
        event.currentTarget.setPointerCapture(event.pointerId)
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
        onSelect()
        resetGesture()
    }
    const move = event => {
        if (!photo || !pointers.current.has(event.pointerId) || !gesture.current) return
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
        const points = [...pointers.current.values()]
        const start = gesture.current
        if (points.length !== start.points.length) return
        const size = event.currentTarget.getBoundingClientRect().width
        if (!size) return
        const a = center(start.points)
        const b = center(points)
        const zoom = points.length === 2
            ? Math.max(1, Math.min(5, start.photo.zoom * distance(points[0], points[1]) / (start.distance || 1)))
            : start.photo.zoom
        onChange(clamp(
            start.photo,
            zoom,
            start.photo.x + (b.x - a.x) / size,
            start.photo.y + (b.y - a.y) / size
        ))
    }
    const up = event => {
        pointers.current.delete(event.pointerId)
        resetGesture()
    }
    const wheel = event => {
        if (!photo) return
        event.preventDefault()
        onSelect()
        const zoom = Math.max(1, Math.min(5, photo.zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08)))
        onChange(clamp(photo, zoom, photo.x, photo.y))
    }
    const rotate = () => {
        const rotation = ((photo.rotation || 0) + 90) % 360
        onChange(clamp({ ...photo, rotation }, photo.zoom, photo.x, photo.y))
    }
    const rotated = photo ? (photo.rotation || 0) % 180 !== 0 : false
    const effectiveWidth = photo ? (rotated ? photo.height : photo.width) : 1
    const effectiveHeight = photo ? (rotated ? photo.width : photo.height) : 1
    const factor = photo ? Math.max(1 / effectiveWidth, 1 / effectiveHeight) * photo.zoom : 1
    const control = "absolute z-10 flex h-6 w-6 items-center justify-center rounded bg-black/25 text-white/80 backdrop-blur-[2px] transition hover:bg-black/50 hover:text-white active:scale-95"

    return (
        <div
            data-photo-frame
            className={`relative h-full w-full overflow-hidden bg-white touch-none ${selected ? "ring-1 ring-inset ring-stone-500" : ""}`}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onLostPointerCapture={up}
            onWheel={wheel}
        >
            {photo ? (
                <>
                    <div
                        className="pointer-events-none absolute"
                        style={{
                            left: `${50 + photo.x * 100}%`,
                            top: `${50 + photo.y * 100}%`,
                            width: `${photo.width * factor * 100}%`,
                            height: `${photo.height * factor * 100}%`,
                            transform: `translate(-50%, -50%) rotate(${photo.rotation || 0}deg)`,
                            transformOrigin: "center"
                        }}
                    >
                        <img
                            src={photo.url}
                            alt=""
                            draggable={false}
                            className="block h-full w-full max-w-none select-none"
                        />
                    </div>
                    {selected && (
                        <>
                            <button
                                type="button"
                                className={`${control} right-1 top-1`}
                                onClick={event => {
                                    event.stopPropagation()
                                    onPick(true)
                                }}
                                title="Заменить фотографию"
                                aria-label="Заменить фотографию"
                            >
                                <i className="bi bi-arrow-repeat text-xs" />
                            </button>
                            {frameIndex > 0 && (
                                <button
                                    type="button"
                                    className={`${control} left-1 top-1`}
                                    onClick={event => {
                                        event.stopPropagation()
                                        onSwap(-1)
                                    }}
                                    title="Переместить выше"
                                    aria-label="Переместить фотографию выше"
                                >
                                    <i className="bi bi-arrow-up text-xs" />
                                </button>
                            )}
                            {frameIndex < 2 && (
                                <button
                                    type="button"
                                    className={`${control} left-1 bottom-1`}
                                    onClick={event => {
                                        event.stopPropagation()
                                        onSwap(1)
                                    }}
                                    title="Переместить ниже"
                                    aria-label="Переместить фотографию ниже"
                                >
                                    <i className="bi bi-arrow-down text-xs" />
                                </button>
                            )}
                            <button
                                type="button"
                                className={`${control} right-1 bottom-1`}
                                onClick={event => {
                                    event.stopPropagation()
                                    rotate()
                                }}
                                title="Повернуть на 90°"
                                aria-label="Повернуть фотографию на 90 градусов"
                            >
                                <i className="bi bi-arrow-clockwise text-sm" />
                            </button>
                        </>
                    )}
                </>
            ) : (
                <button
                    type="button"
                    className="absolute inset-0 flex w-full flex-col items-center justify-center gap-1 border border-dashed border-stone-200 bg-stone-50/40 text-stone-400 transition hover:bg-stone-50"
                    onClick={() => onPick(false)}
                    aria-label="Добавить фотографии"
                >
                    <i className="bi bi-plus-lg text-xl" />
                    <span className="text-[10px] font-medium">Добавить фото</span>
                </button>
            )}
        </div>
    )
}

export default PhotoFrame
