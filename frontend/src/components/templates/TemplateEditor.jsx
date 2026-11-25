
import { useEffect, useRef, useState } from "react"
import JSZip from "jszip"
import PhotoFrame from "./PhotoFrame"
import { getDraft, createDraftFolder, uploadDraftFile } from "../../http/draftsApi"

const TEMPLATE_NAME = "Фотополоски"
const TEMPLATE_FORMAT = "5,4×15,2"
const DPI = 300
const CM = DPI / 2.54
const STRIP_WIDTH = Math.round(5.4 * CM)
const STRIP_HEIGHT = Math.round(15.2 * CM)
const FRAME = 4.4 * CM
const GAP = 0.5 * CM
const emptyStrip = () => [null, null, null]
const isHeic = file => /\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]$/i.test(file.type)
const isSafari = () => /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|Chromium|Edg|OPR|FxiOS/i.test(navigator.userAgent)

const loadImage = url => new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Не удалось открыть изображение"))
    image.src = url
})

const createPhoto = async file => {
    if (!file.size) throw new Error("Файл пустой")
    const heic = isHeic(file)
    let url = URL.createObjectURL(file)
    let image
    try {
        if (!heic || isSafari()) {
            try {
                image = await loadImage(url)
            } catch (error) {
                if (!heic) throw error
            }
        }
        if (!image) {
            URL.revokeObjectURL(url)
            url = null
            const { heicTo } = await import("heic-to")
            const blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.98 })
            url = URL.createObjectURL(blob)
            image = await loadImage(url)
        }
        return {
            url,
            width: image.naturalWidth,
            height: image.naturalHeight,
            zoom: 1,
            x: 0,
            y: 0,
            rotation: 0
        }
    } catch (error) {
        if (url) URL.revokeObjectURL(url)
        console.error("Ошибка загрузки фотографии:", file.name, error)
        throw new Error(`Не удалось открыть: ${file.name}`)
    }
}

const toBlob = canvas => new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Ошибка создания PNG")), "image/png")
})

const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
}

const renderStrip = async strip => {
    const canvas = document.createElement("canvas")
    canvas.width = STRIP_WIDTH
    canvas.height = STRIP_HEIGHT
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
    for (let i = 0; i < 3; i++) {
        const photo = strip[i]
        if (!photo) continue
        const image = await loadImage(photo.url)
        const left = GAP
        const top = GAP + i * (FRAME + GAP)
        const rotated = (photo.rotation || 0) % 180 !== 0
        const effectiveWidth = rotated ? photo.height : photo.width
        const effectiveHeight = rotated ? photo.width : photo.height
        const factor = Math.max(FRAME / effectiveWidth, FRAME / effectiveHeight) * photo.zoom
        ctx.save()
        ctx.beginPath()
        ctx.rect(left, top, FRAME, FRAME)
        ctx.clip()
        ctx.translate(left + FRAME / 2 + photo.x * FRAME, top + FRAME / 2 + photo.y * FRAME)
        ctx.rotate((photo.rotation || 0) * Math.PI / 180)
        ctx.drawImage(image, -photo.width * factor / 2, -photo.height * factor / 2, photo.width * factor, photo.height * factor)
        ctx.restore()
    }
    return toBlob(canvas)
}

const TemplateEditor = ({ template, onBack }) => {
    const [strips, setStrips] = useState([emptyStrip()])
    const [selected, setSelected] = useState(null)
    const [exporting, setExporting] = useState(false)
    const [savingToFiles, setSavingToFiles] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [viewHeight, setViewHeight] = useState(540)
    const [scrollInfo, setScrollInfo] = useState({ visible: false, thumbWidth: 100, position: 0 })
    const [notice, setNotice] = useState("")
    const inputRef = useRef(null)
    const areaRef = useRef(null)
    const scrollRef = useRef(null)
    const trackRef = useRef(null)
    const requestRef = useRef(null)
    const scrollToNewRef = useRef(false)
    const noticeTimerRef = useRef(null)
    const stripsRef = useRef(strips)
    const mountedRef = useRef(true)
    stripsRef.current = strips

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            clearTimeout(noticeTimerRef.current)
            const urls = new Set()
            stripsRef.current.flat().forEach(photo => {
                if (photo?.url) urls.add(photo.url)
            })
            urls.forEach(url => URL.revokeObjectURL(url))
        }
    }, [])

    useEffect(() => {
        const deselect = event => {
            if (!event.target.closest("[data-photo-frame]")) setSelected(null)
        }
        document.addEventListener("pointerdown", deselect)
        return () => document.removeEventListener("pointerdown", deselect)
    }, [])

    useEffect(() => {
        if (!areaRef.current) return
        const observer = new ResizeObserver(entries => setViewHeight(entries[0].contentRect.height))
        observer.observe(areaRef.current)
        return () => observer.disconnect()
    }, [])

    const updateScroll = () => {
        const element = scrollRef.current
        if (!element) return
        const max = element.scrollWidth - element.clientWidth
        setScrollInfo({
            visible: max > 2,
            thumbWidth: max > 2 ? Math.max(8, element.clientWidth / element.scrollWidth * 100) : 100,
            position: max > 2 ? element.scrollLeft / max : 0
        })
    }

    useEffect(() => {
        const element = scrollRef.current
        if (!element) return
        const observer = new ResizeObserver(updateScroll)
        observer.observe(element)
        if (element.firstElementChild) observer.observe(element.firstElementChild)
        updateScroll()
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        updateScroll()
        if (scrollToNewRef.current && scrollRef.current) {
            scrollToNewRef.current = false
            requestAnimationFrame(() => {
                const element = scrollRef.current
                if (!element) return
                const max = element.scrollWidth - element.clientWidth
                if (max > 2) element.scrollTo({ left: max, behavior: "smooth" })
            })
        }
    }, [strips.length, viewHeight])

    const hasPhotos = strips.some(strip => strip.some(Boolean))
    const missing = strips.reduce((sum, strip) => sum + strip.filter(photo => !photo).length, 0)
    const ready = missing === 0

    const showNotice = message => {
        clearTimeout(noticeTimerRef.current)
        setNotice(message)
        noticeTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setNotice("")
        }, 3000)
    }

    const update = (stripIndex, frameIndex, photo) => {
        setStrips(previous => previous.map((strip, index) =>
            index === stripIndex ? strip.map((item, frame) => frame === frameIndex ? photo : item) : strip
        ))
    }

    const pick = (stripIndex, frameIndex, replace = false) => {
        requestRef.current = { stripIndex, frameIndex, replace }
        if (!inputRef.current) return
        inputRef.current.value = ""
        inputRef.current.multiple = !replace
        inputRef.current.click()
    }

    const handleFiles = async event => {
        const files = Array.from(event.target.files || [])
        const request = requestRef.current
        event.target.value = ""
        if (!files.length || !request || processing) return
        const { stripIndex, frameIndex, replace } = request
        const strip = stripsRef.current[stripIndex]
        if (!strip) return
        const slots = replace
            ? [frameIndex]
            : [frameIndex, ...strip.map((_, index) => index).filter(index => index !== frameIndex)].filter(index => !strip[index])
        const selectedFiles = files.slice(0, slots.length)
        if (!selectedFiles.length) {
            showNotice("На этой полоске нет свободных кадров")
            return
        }
        setProcessing(true)
        try {
            const results = await Promise.allSettled(selectedFiles.map(createPhoto))
            const changes = []
            const errors = []
            results.forEach((result, index) => {
                if (result.status === "fulfilled") changes.push({ frameIndex: slots[index], photo: result.value })
                else errors.push(result.reason?.message || selectedFiles[index].name)
            })
            if (!mountedRef.current) {
                changes.forEach(item => URL.revokeObjectURL(item.photo.url))
                return
            }
            if (changes.length) {
                const previousStrip = stripsRef.current[stripIndex]
                changes.forEach(change => {
                    const old = previousStrip?.[change.frameIndex]
                    if (old?.url && old.url !== change.photo.url) URL.revokeObjectURL(old.url)
                })
                setStrips(previous => previous.map((item, index) => {
                    if (index !== stripIndex) return item
                    const updated = [...item]
                    changes.forEach(change => { updated[change.frameIndex] = change.photo })
                    return updated
                }))
                setSelected({ stripIndex, frameIndex: changes[0].frameIndex })
            }
            if (errors.length) showNotice(errors[0])
            else if (files.length > slots.length) showNotice(`Можно добавить только ${slots.length} фото на эту полоску`)
        } finally {
            if (mountedRef.current) setProcessing(false)
        }
    }

    const swap = (stripIndex, frameIndex, direction) => {
        const target = frameIndex + direction
        if (target < 0 || target > 2) return
        setStrips(previous => previous.map((strip, index) => {
            if (index !== stripIndex) return strip
            const updated = [...strip]
            ;[updated[frameIndex], updated[target]] = [updated[target], updated[frameIndex]]
            return updated
        }))
        setSelected({ stripIndex, frameIndex: target })
    }

    const removeStrip = stripIndex => {
        const strip = strips[stripIndex]
        if (!strip || strips.length === 1) return
        if (strip.some(Boolean) && !window.confirm("Удалить полоску с фотографиями?")) return
        setStrips(previous => previous.filter((_, index) => index !== stripIndex))
        strip.forEach(photo => { if (photo?.url) URL.revokeObjectURL(photo.url) })
        setSelected(null)
    }

    const goBack = () => {
        if (hasPhotos && !window.confirm("Выйти из редактора? Добавленные фотографии будут потеряны.")) return
        onBack()
    }

    const download = async () => {
        if (exporting || savingToFiles || processing) return
        if (!ready) {
            showNotice(`Для скачивания заполните все кадры. Осталось добавить фото: ${missing}.`)
            return
        }
        setExporting(true)
        try {
            if (strips.length === 1) {
                saveBlob(await renderStrip(strips[0]), "LINK-фотополоска-1.png")
            } else {
                const zip = new JSZip()
                for (let index = 0; index < strips.length; index++) {
                    zip.file(`LINK-фотополоска-${index + 1}.png`, await renderStrip(strips[index]))
                }
                saveBlob(await zip.generateAsync({ type: "blob" }), "LINK-фотополоски.zip")
            }
        } catch (error) {
            console.error("Ошибка экспорта:", error)
            showNotice("Не удалось скачать фотополоски")
        } finally {
            if (mountedRef.current) setExporting(false)
        }
    }

    const addToMyFiles = async () => {
        if (exporting || savingToFiles || processing) return
        if (!ready) {
            showNotice(`Заполните все кадры. Осталось добавить фото: ${missing}.`)
            return
        }
        setSavingToFiles(true)
        try {
            const draft = await getDraft()
            let folder = draft.folders.find(item =>
                item.type === "template" &&
                item.name === TEMPLATE_NAME &&
                item.format === TEMPLATE_FORMAT
            )
            if (!folder) {
                folder = await createDraftFolder({
                    name: TEMPLATE_NAME,
                    format: TEMPLATE_FORMAT,
                    type: "template"
                })
            }
            const usedNumbers = new Set(
                (folder.items || [])
                    .map(item => /^Фотополоска №(\d+)\.png$/i.exec(item.originalName)?.[1])
                    .filter(Boolean)
                    .map(Number)
            )

            let nextNumber = Math.max(0, ...usedNumbers) + 1

            for (let index = 0; index < strips.length; index++) {
                const blob = await renderStrip(strips[index])
                const filename = `Фотополоска №${nextNumber++}.png`
                const file = new File([blob], filename, { type: "image/png" })
                await uploadDraftFile(folder.id, file)
            }
            window.location.assign(`/myFiles?folder=${encodeURIComponent(folder.id)}`)
        } catch (error) {
            console.error("Ошибка добавления фотополосок:", error)
            showNotice(error?.response?.data?.message || "Не удалось добавить фотополоски. Уже загруженные файлы сохранены.")
        } finally {
            if (mountedRef.current) setSavingToFiles(false)
        }
    }

    const scrollFromPointer = event => {
        const track = trackRef.current
        const scroll = scrollRef.current
        if (!track || !scroll) return
        const bounds = track.getBoundingClientRect()
        const thumb = bounds.width * scrollInfo.thumbWidth / 100
        const maxTrack = Math.max(1, bounds.width - thumb)
        const offset = Math.max(0, Math.min(maxTrack, event.clientX - bounds.left - thumb / 2))
        scroll.scrollLeft = offset / maxTrack * (scroll.scrollWidth - scroll.clientWidth)
    }

    const addStrip = () => {
        scrollToNewRef.current = true
        setStrips(previous => [...previous, emptyStrip()])
        setSelected(null)
    }

    const stripHeight = Math.max(100, Math.min(viewHeight - 36, 540))
    const stripWidth = stripHeight * 5.4 / 15.2
    const frameSize = stripHeight * 4.4 / 15.2
    const margin = stripHeight * 0.5 / 15.2

    const addButton = (
        <button type="button" onClick={addStrip} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:border-stone-400 hover:text-stone-800" aria-label="Добавить фотополоску">
            <i className="bi bi-plus-lg text-lg" />
        </button>
    )

    return (
        <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-50">
            <div className="mb-3 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
                <button type="button" onClick={goBack} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
                    <i className="bi bi-arrow-left text-lg" /><span className="hidden sm:inline">Назад</span>
                </button>
                <h1 className="truncate text-center text-[17px] font-normal tracking-[0.025em] text-slate-600">{template?.name || "Фотополоска · 3 фото"}</h1>
                <span className="whitespace-nowrap text-right text-xs text-stone-400">5,4 × 15,2 см</span>
            </div>
            <div ref={areaRef} className="relative flex min-h-0 flex-1 items-stretch overflow-hidden bg-slate-50">
                <div ref={scrollRef} onScroll={updateScroll} className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain bg-slate-50" style={{ scrollbarWidth: "none" }}>
                    <div className="flex h-full w-max min-w-full items-center justify-center gap-5 px-3 py-[18px] md:gap-8 md:px-8">
                        {strips.map((strip, stripIndex) => (
                            <div key={stripIndex} className="relative shrink-0 bg-white shadow-[0_0_18px_rgba(0,0,0,0.16)]" style={{ width: stripWidth, height: stripHeight, padding: margin }}>
                                {strips.length > 1 && (
                                    <button type="button" onClick={() => removeStrip(stripIndex)} className="absolute -right-3 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm hover:text-red-600" aria-label="Удалить фотополоску">
                                        <i className="bi bi-x-lg text-[10px]" />
                                    </button>
                                )}
                                <div className="flex flex-col" style={{ gap: margin }}>
                                    {strip.map((photo, frameIndex) => (
                                        <div key={frameIndex} style={{ width: frameSize, height: frameSize }}>
                                            <PhotoFrame photo={photo} onChange={value => update(stripIndex, frameIndex, value)} onPick={replace => pick(stripIndex, frameIndex, replace)} onSelect={() => setSelected({ stripIndex, frameIndex })} selected={selected?.stripIndex === stripIndex && selected?.frameIndex === frameIndex} frameIndex={frameIndex} onSwap={direction => swap(stripIndex, frameIndex, direction)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="z-20 hidden w-[60px] shrink-0 flex-col items-center justify-center gap-2 bg-slate-50 sm:flex">
                    {addButton}<span className="text-[10px] text-stone-400">Добавить</span>
                </div>
            </div>
            <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
                {addButton}<span className="mt-1 text-[10px] text-stone-400">Добавить полоску</span>
            </div>
            {scrollInfo.visible && (
                <div ref={trackRef} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); scrollFromPointer(event) }} onPointerMove={event => { if (event.buttons) scrollFromPointer(event) }} className="mx-3 mt-2 h-2 shrink-0 cursor-pointer overflow-hidden rounded-full bg-stone-200" style={{ touchAction: "none" }}>
                    <div className="h-full rounded-full bg-stone-500" style={{ width: `${scrollInfo.thumbWidth}%`, marginLeft: `${scrollInfo.position * (100 - scrollInfo.thumbWidth)}%` }} />
                </div>
            )}
            <div className="flex shrink-0 items-center justify-between gap-2 pt-3 pb-1">
                <span className="whitespace-nowrap text-xs text-stone-400">Полосок: {strips.length}</span>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={download} disabled={exporting || processing || savingToFiles} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm transition ${ready ? "bg-stone-800 text-white hover:bg-stone-700" : "bg-stone-200 text-stone-400"} disabled:cursor-wait`}>
                        <i className="bi bi-download" /><span>{exporting ? "Сохранение…" : "Скачать"}</span>
                    </button>
                    <button type="button" onClick={addToMyFiles} disabled={exporting || processing || savingToFiles} className={`rounded-md border border-stone-300 px-4 py-2 text-sm transition hover:border-stone-500 disabled:cursor-wait disabled:opacity-50 ${ready ? "text-stone-700" : "text-stone-400"}`}>{savingToFiles ? "Добавление…" : "В заказ"}</button>
                </div>
            </div>
            {processing && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/75">
                    <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm text-stone-600 shadow-lg"><i className="bi bi-arrow-repeat animate-spin text-lg" />Обработка фотографий…</div>
                </div>
            )}
            {notice && !processing && (
                <div role="status" className="absolute bottom-16 left-1/2 z-50 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-3 rounded-lg bg-stone-800 px-4 py-3 text-center text-xs text-white shadow-lg">
                    <span>{notice}</span>
                    <button type="button" onClick={() => { clearTimeout(noticeTimerRef.current); setNotice("") }} aria-label="Закрыть уведомление"><i className="bi bi-x-lg" /></button>
                </div>
            )}
            <input ref={inputRef} type="file" accept="image/*,.heic,.heif" hidden onChange={handleFiles} />
        </div>
    )
}

export default TemplateEditor
