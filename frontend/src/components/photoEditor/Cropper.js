import { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';

const CropperComponent = ({ photos, activePhoto, onSaveCrop, isSwitchingRef }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [cropSize, setCropSize] = useState(photos[activePhoto]?.cropData || { width: 400, height: 600 });

    // готовность параметров кропа для ТЕКУЩЕГО activePhoto.
    // Пока false — Cropper прячется, чтобы не показать кадр от предыдущего
    // фото (или нейтральный дефолт) наложенным на новую картинку.
    const [mediaReady, setMediaReady] = useState(false);

    const cropRef = useRef(null);
    const cropStateRef = useRef({ crop: { x: 0, y: 0 }, zoom: 1, rotation: 0 });

    useEffect(() => {
        cropStateRef.current = { crop, zoom, rotation };
    }, [crop, zoom, rotation]);

    // Восстановление при смене фото.
    // Завязан только на activePhoto (не на photos целиком) — иначе эффект
    // перезапускается на каждое onSaveCrop текущего фото.
    useEffect(() => {
        setMediaReady(false); // прячем кроппер СРАЗУ, до применения новых параметров

        const data = photos[activePhoto]?.cropData;

        if (!data) {
            // новое фото без сохранённого кропа — сбрасываем ВСЁ, включая
            // cropSize (раньше это было упущено, и рамка оставалась от
            // предыдущего фото, пока onMediaLoaded не пересчитает её)
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setCropSize({ width: 400, height: 600 });
            return;
        }

        setCrop(data.crop ?? { x: 0, y: 0 });
        setZoom(data.zoom ?? 1);
        setRotation(data.rotation ?? 0);
        // ?? вместо if — если cropData есть, но cropSize внутри него undefined,
        // всё равно переустанавливаем явно, а не оставляем значение от предыдущего фото
        setCropSize(data.cropSize ?? { width: 400, height: 600 });
        // данные уже известны — можно сразу показывать, не дожидаясь onMediaLoaded
        setMediaReady(true);
    }, [activePhoto, photos]);

    const onMediaLoaded = (mediaSize) => {
        // Если есть сохранённые данные — ничего не считаем, просто показываем
        if (photos[activePhoto]?.cropData?.cropSize) {
            setMediaReady(true);
            return;
        }

        const container = cropRef.current?.containerRect;
        if (!container) return;

        // Формат 10x15 см
        const formatW = 10;
        const formatH = 15;
        const formatRatio = mediaSize.height>mediaSize.width ? Math.min((formatW / formatH),  (formatH/formatW)) : Math.max((formatW / formatH),  (formatH/formatW)) // 0.6667 (вертикальный)

        // 80% от меньшей стороны контейнера
        const maxSize = Math.min(container.width, container.height) * 0.8;

        // Считаем cropSize по пропорциям 10x15
        let w, h;
        if (formatRatio < 1) {
            // Вертикальный формат (10x15): высота = 80%, ширина = высота * ratio
            h = maxSize;
            w = h * formatRatio;
        } else {
            // Горизонтальный формат
            w = maxSize;
            h = w / formatRatio;
        }

        const newCropSize = { width: w, height: h };
        setCropSize(newCropSize);

        // Зум: чтобы изображение заполнило cropSize
        const valueZoom = Math.max(
            newCropSize.width / mediaSize.width,
            newCropSize.height / mediaSize.height
        );
        setZoom(valueZoom);

        onSaveCrop(photos[activePhoto].id, {
            cropSize: newCropSize,
            zoom: valueZoom,
            crop: { x: 0, y: 0 },
            rotation: 0,
            croppedAreaPixels: null,
        });

        setMediaReady(true);
    };

    const onCropChange = (newCrop) => {
        setCrop(newCrop);
    };

    const onZoomChange = (newZoom) => {
        setZoom(newZoom);
    };

    const onCropComplete = useCallback(
        (_croppedArea, croppedAreaPixels) => {
            if (isSwitchingRef.current) return;

            cropStateRef.current = {
                ...cropStateRef.current,
                croppedAreaPixels,
            };

            onSaveCrop(photos[activePhoto].id, {
                crop,
                zoom,
                rotation,
                cropSize,
                croppedAreaPixels,
            });
        },
        [photos, activePhoto, crop, zoom, rotation, cropSize, onSaveCrop, isSwitchingRef]
    );

    if (!photos[activePhoto]) {
        return null;
    }

    return (
        <div
            className="relative border border-[#d0d0cc] rounded-sm bg-[#fafaf8] overflow-hidden transition-opacity duration-100"
            style={{ width: 'min(38vw, 520px)', height: 'min(38vw, 520px)', opacity: mediaReady ? 1 : 0 }}
        >
            <Cropper
                image={photos[activePhoto].url}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                cropSize={cropSize}
                ref={cropRef}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropComplete}
                onMediaLoaded={onMediaLoaded}
                zoomWithScroll={false}
                restrictPosition={true}
                showGrid={false}
            />
        </div>
    );
};

export default CropperComponent;