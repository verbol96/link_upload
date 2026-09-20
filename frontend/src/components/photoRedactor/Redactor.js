import React, { useEffect, useRef, useState } from "react";
import CropperMain from "./CropperMain"
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { $host } from '../../http';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import jpeg from 'jpeg-js';

// Форматирование времени: 12 с / 1 мин 5 с
const formatElapsed = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} с`;
    return `${m} мин ${s} с`;
};

// Пауза, гарантирующая перерисовку UI перед тяжёлой синхронной работой
const yieldToUI = (ms = 40) =>
    new Promise(resolve => setTimeout(resolve, ms));

const Redactor = () => {

    const [photos, setPhotos] = useState([]);
    const [activePhoto, setActivePhoto] = useState(0);

    const [loadingCount, setLoadingCount] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadDone, setDownloadDone] = useState(false);
    const [nameOrder, setNameOrder] = useState('');
    const [nameFormat, setNameFormat] = useState('');

    const [settingsDB, setSettingsDB] = useState([]);
    const [activeSettings, setActiveSettings] = useState(null);

    const [unprocessedAlert, setUnprocessedAlert] = useState([]);
    const [outputFormat, setOutputFormat] = useState('jpeg');

    // Прогресс: общее число шагов и метка ("фото" или "листов")
    const [totalSteps, setTotalSteps] = useState(0);
    const [progressUnit, setProgressUnit] = useState('фото');

    // Секундомер
    const [downloadStartTime, setDownloadStartTime] = useState(null);
    const [downloadElapsed, setDownloadElapsed] = useState(0);

    // pixels по id фото
    const pixelsRef = useRef({});

    // загрузка настроек из БД
    useEffect(() => {
        async function getSettingEditor() {
            const { data } = await $host.get('api/settings/getSettingEditor');

            if (data.length < 1) {
                const data1 = {
                    name: '10x15',
                    width: 10,
                    height: 15,
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    widthList: 10,
                    heightList: 15
                };
                await $host.put('api/settings/changeSettingEditor', data1);
            }

            const dataSort = _.sortBy(data, 'name', 'asc');
            setSettingsDB(dataSort);
            setActiveSettings(dataSort[0]);
            setNameFormat(dataSort[0]?.name);
        }
        getSettingEditor();
    }, []);

    // Тик секундомера
    useEffect(() => {
        if (!isDownloading || downloadDone || !downloadStartTime) return;

        const interval = setInterval(() => {
            setDownloadElapsed(Math.floor((Date.now() - downloadStartTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [isDownloading, downloadDone, downloadStartTime]);

    // загрузка фото
    const [convertingCount, setConvertingCount] = useState(0);
    const [processingCount, setProcessingCount] = useState(0);
    const [processingTotal, setProcessingTotal] = useState(0);

    const createThumbnail = (file, maxSize = 800) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = Math.round(width);
                canvas.height = Math.round(height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    resolve(URL.createObjectURL(blob));
                }, 'image/jpeg', 0.85);
            };
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        });
    };

    const getLibheif = async () => {
        const mod = await import('libheif-js/wasm-bundle');
        return mod.default || mod;
    };

    const convertHeic = async (file) => {
        const libheif = await getLibheif();

        const buffer = await file.arrayBuffer();
        const decoder = new libheif.HeifDecoder();
        const images = decoder.decode(new Uint8Array(buffer));

        if (!images || images.length === 0) {
            throw new Error('Не удалось декодировать HEIC');
        }

        const image = images[0];
        const width = image.get_width();
        const height = image.get_height();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        let ctx;
        try {
            ctx = canvas.getContext('2d', { colorSpace: 'display-p3' });
            if (!ctx) {
                ctx = canvas.getContext('2d');
            }
        } catch {
            ctx = canvas.getContext('2d');
        }

        const imageData = ctx.createImageData(width, height);

        await new Promise((resolve, reject) => {
            image.display(imageData, (result) => {
                if (!result) {
                    reject(new Error('Ошибка отображения HEIC'));
                } else {
                    resolve(result);
                }
            });
        });

        ctx.putImageData(imageData, 0, 0);

        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
    };

    const handleAddPhotos = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        setConvertingCount(files.length);

        await new Promise(requestAnimationFrame);

        const processedFiles = await Promise.all(
            files.map(async (file) => {
                const isHeic = /\.(heic|heif)$/i.test(file.name)
                            || file.type === 'image/heic'
                            || file.type === 'image/heif';

                let result = file;

                if (isHeic && !isSafari) {
                    try {
                        const blob = await convertHeic(file);
                        const newName = file.name.replace(/\.(heic|heif)$/i, '.jpeg');
                        result = new File([blob], newName, { type: 'image/jpeg' });
                    } catch (err) {
                        console.error('Ошибка конвертации HEIC:', err);
                    }
                }

                setConvertingCount(prev => Math.max(0, prev - 1));
                return result;
            })
        );

        setProcessingTotal(processedFiles.length);
        setProcessingCount(processedFiles.length);

        // Здесь операция лёгкая (превью 200×200) — rAF достаточно
        await new Promise(requestAnimationFrame);

        const newPhotos = [];
        for (let i = 0; i < processedFiles.length; i++) {
            const file = processedFiles[i];
            const thumb = await createThumbnail(file, 200);

            newPhotos.push({
                id: uuidv4(),
                url: URL.createObjectURL(file),
                thumb: thumb,
                name: file.name,
                size: file.size,
                cropData: null
            });

            setProcessingCount(prev => Math.max(0, prev - 1));
            await new Promise(requestAnimationFrame);
        }

        setPhotos((prev) => [...prev, ...newPhotos]);
        setActivePhoto(0);
        e.target.value = '';

        setProcessingCount(0);
        setProcessingTotal(0);
    };

    const onSaveCrop = (photoId, newData) => {
        setPhotos(prev => prev.map(photo =>
            photo.id === photoId
                ? {
                    ...photo,
                    cropData: {
                        ...photo.cropData,
                        ...newData
                    }
                }
                : photo
        ));
    };

    const computePixelsFromCropData = (cropData) => {
        if (!cropData) return null;
        const { crop, cropSize, zoom, media } = cropData;
        if (!media || !cropSize || !crop) return null;

        const displayW = media.width * zoom;
        const displayH = media.height * zoom;

        const kX = media.naturalWidth / displayW;
        const kY = media.naturalHeight / displayH;

        const pixelsW = cropSize.width * kX;
        const pixelsH = cropSize.height * kY;

        const x = (media.naturalWidth  - pixelsW) / 2 - crop.x * kX;
        const y = (media.naturalHeight - pixelsH) / 2 - crop.y * kY;

        return { x, y, width: pixelsW, height: pixelsH };
    };

    const canvasToJpegBlob = (canvas, quality = 92) => {
        const ctx = canvas.getContext('2d');
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const encoded = jpeg.encode({ data, width, height }, quality);
        return new Blob([encoded.data], { type: 'image/jpeg' });
    };

    const canvasToBlob = async (canvas, outputFormat, quality = 92) => {
        if (outputFormat === 'png') {
            return await new Promise(resolve =>
                canvas.toBlob(resolve, 'image/png')
            );
        }
        return canvasToJpegBlob(canvas, quality);
    };

    const savePhotos = async () => {
        const unprocessed = photos
            .map((p, i) => (!p.cropData ? i + 1 : null))
            .filter(Boolean);
        if (unprocessed.length) {
            setUnprocessedAlert(unprocessed);
            setTimeout(() => setUnprocessedAlert([]), 2000);
            return;
        }

        setIsDownloading(true);
        setDownloadDone(false);
        setLoadingCount(0);

        // Старт секундомера
        setDownloadStartTime(Date.now());
        setDownloadElapsed(0);

        // Даём модалке отрисоваться перед тяжёлой работой
        await yieldToUI(40);

        const photosSnapshot = [...photos];
        const settingsSnapshot = { ...activeSettings };

        const zip = new JSZip();

        const images = await Promise.all(
            photosSnapshot.map(photo =>
                new Promise((resolve, reject) => {
                    const el = new Image();
                    el.crossOrigin = 'anonymous';
                    el.onload = () => resolve(el);
                    el.onerror = reject;
                    el.src = photo.url;
                })
            )
        );

        const PX_PER_CM = 300;

        const cardW = Math.round(
            (Number(settingsSnapshot.width) + Number(settingsSnapshot.left) + Number(settingsSnapshot.right)) * PX_PER_CM
        );
        const cardH = Math.round(
            (Number(settingsSnapshot.height) + Number(settingsSnapshot.top) + Number(settingsSnapshot.bottom)) * PX_PER_CM
        );

        const sheetW = Math.round(Number(settingsSnapshot.widthList)  * PX_PER_CM);
        const sheetH = Math.round(Number(settingsSnapshot.heightList) * PX_PER_CM);

        const cols = Math.max(1, Math.floor(sheetW / cardW));
        const rows = Math.max(1, Math.floor(sheetH / cardH));
        const perPage = cols * rows;

        const pagesCount = Math.ceil(photosSnapshot.length / perPage);

        // Прогресс:
        // - режим A: 1 шаг = 1 фото → totalSteps = photos
        // - режим B: 1 шаг = 1 лист → totalSteps = pagesCount
        setTotalSteps(perPage === 1 ? photosSnapshot.length : pagesCount);
        setProgressUnit('фото');

        // =====================================================
        // РЕЖИМ A: perPage === 1 — 1 фото на лист
        // =====================================================
        if (perPage === 1) {
            for (let i = 0; i < photosSnapshot.length; i++) {
                const photo = photosSnapshot[i];
                const img = images[i];
                const { rotation } = photo.cropData;

                const pixels = pixelsRef.current[photo.id]
                    || computePixelsFromCropData(photo.cropData);

                if (!pixels) continue;

                setLoadingCount(prev => prev + 1);
                // Гарантируем перерисовку прогресса перед тяжёлой работой
                await yieldToUI(40);

                const rotatedCanvasOrigPhoto = document.createElement('canvas');
                const rotatedOrigPhoto = rotatedCanvasOrigPhoto.getContext('2d');
                const isRotated90 = rotation === 90 || rotation === 270;

                rotatedCanvasOrigPhoto.width  = isRotated90 ? img.height : img.width;
                rotatedCanvasOrigPhoto.height = isRotated90 ? img.width  : img.height;

                rotatedOrigPhoto.translate(rotatedCanvasOrigPhoto.width / 2, rotatedCanvasOrigPhoto.height / 2);
                rotatedOrigPhoto.rotate(((rotation || 0) * Math.PI) / 180);
                rotatedOrigPhoto.drawImage(img, -img.width / 2, -img.height / 2);

                const isPhotoHorizontal = pixels.width > pixels.height;

                const cardWidthCm  = isPhotoHorizontal
                    ? Math.max(Number(settingsSnapshot.height), Number(settingsSnapshot.width))
                    : Math.min(Number(settingsSnapshot.height), Number(settingsSnapshot.width));
                const cardHeightCm = isPhotoHorizontal
                    ? Math.min(Number(settingsSnapshot.height), Number(settingsSnapshot.width))
                    : Math.max(Number(settingsSnapshot.height), Number(settingsSnapshot.width));

                const photoIsHorizontal = pixels.width > pixels.height;
                const cardIsHorizontal = cardWidthCm > cardHeightCm;
                const needSwap = photoIsHorizontal !== cardIsHorizontal;

                let pxPerCmX, pxPerCmY;
                if (needSwap) {
                    pxPerCmX = pixels.height / cardHeightCm;
                    pxPerCmY = pixels.width  / cardWidthCm;
                } else {
                    pxPerCmX = pixels.width  / cardWidthCm;
                    pxPerCmY = pixels.height / cardHeightCm;
                }

                const leftPx   = Math.round(Number(settingsSnapshot.left)   * pxPerCmX);
                const rightPx  = Math.round(Number(settingsSnapshot.right)  * pxPerCmX);
                const topPx    = Math.round(Number(settingsSnapshot.top)    * pxPerCmY);
                const bottomPx = Math.round(Number(settingsSnapshot.bottom) * pxPerCmY);

                const cardContentW = pixels.width  + leftPx + rightPx;
                const cardContentH = pixels.height + topPx  + bottomPx;

                let pxPerCm;
                if (pixels.width > pixels.height) {
                    pxPerCm = Math.max(
                        pixels.height / Number(settingsSnapshot.width),
                        pixels.width  / Number(settingsSnapshot.height)
                    );
                } else {
                    pxPerCm = Math.max(
                        pixels.width  / Number(settingsSnapshot.width),
                        pixels.height / Number(settingsSnapshot.height)
                    );
                }

                let finalSheetW = Math.round(Number(settingsSnapshot.widthList)  * pxPerCm);
                let finalSheetH = Math.round(Number(settingsSnapshot.heightList) * pxPerCm);

                const EPS = 0.02;
                const isSquare = Math.abs(cardContentW - cardContentH) / Math.max(cardContentW, cardContentH) < EPS;
                const isCardPortrait = cardContentH > cardContentW;
                const isSheetPortrait = finalSheetH > finalSheetW;

                if (!isSquare && isCardPortrait !== isSheetPortrait) {
                    [finalSheetW, finalSheetH] = [finalSheetH, finalSheetW];
                }

                const canvas = document.createElement('canvas');
                canvas.width  = finalSheetW;
                canvas.height = finalSheetH;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, finalSheetW, finalSheetH);

                const offsetX = leftPx;
                const offsetY = topPx;

                const srcX = Math.max(0, pixels.x);
                const srcY = Math.max(0, pixels.y);

                const drawX = offsetX + (pixels.x < 0 ? -pixels.x : 0);
                const drawY = offsetY + (pixels.y < 0 ? -pixels.y : 0);

                const maxPhotoW = pixels.width  - (pixels.x < 0 ? -pixels.x : 0);
                const maxPhotoH = pixels.height - (pixels.y < 0 ? -pixels.y : 0);

                const srcW = Math.min(pixels.width,  maxPhotoW);
                const srcH = Math.min(pixels.height, maxPhotoH);

                ctx.drawImage(
                    rotatedCanvasOrigPhoto,
                    srcX, srcY, srcW, srcH,
                    drawX, drawY, srcW, srcH
                );

                ctx.strokeStyle = '#aaa';
                ctx.lineWidth = 1;
                ctx.setLineDash([8, 6]);

                ctx.beginPath();
                ctx.moveTo(cardContentW, 0);
                ctx.lineTo(cardContentW, finalSheetH);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, cardContentH);
                ctx.lineTo(finalSheetW, cardContentH);
                ctx.stroke();

                ctx.setLineDash([]);

                const blob = await canvasToBlob(canvas, outputFormat, 92);

                const ext = outputFormat === 'png' ? 'png' : 'jpeg';
                const fileName = photosSnapshot.length > 1
                    ? `${photo.name.split('.')[0]}.${ext}`
                    : `${nameOrder}_${nameFormat}.${ext}`;

                zip.file(fileName, blob);
            }
        } else {
            // =====================================================
            // РЕЖИМ B: perPage >= 2 — несколько фото на лист
            // =====================================================
            const pages = [];
            for (let i = 0; i < photosSnapshot.length; i += perPage) {
                pages.push(photosSnapshot.slice(i, i + perPage));
            }

            const cards = [];

            for (let i = 0; i < photosSnapshot.length; i++) {
                const photo = photosSnapshot[i];
                const img = images[i];
                const { rotation } = photo.cropData;

                const pixels = pixelsRef.current[photo.id]
                    || computePixelsFromCropData(photo.cropData);

                if (!pixels) continue;

                // Подготовка карточек — операция лёгкая, rAF достаточно
                await new Promise(requestAnimationFrame);

                const rotatedCanvasOrigPhoto = document.createElement('canvas');
                const rotatedOrigPhoto = rotatedCanvasOrigPhoto.getContext('2d');
                const isRotated90 = rotation === 90 || rotation === 270;

                rotatedCanvasOrigPhoto.width  = isRotated90 ? img.height : img.width;
                rotatedCanvasOrigPhoto.height = isRotated90 ? img.width  : img.height;

                rotatedOrigPhoto.translate(rotatedCanvasOrigPhoto.width / 2, rotatedCanvasOrigPhoto.height / 2);
                rotatedOrigPhoto.rotate(((rotation || 0) * Math.PI) / 180);
                rotatedOrigPhoto.drawImage(img, -img.width / 2, -img.height / 2);

                const cardCanvas = document.createElement('canvas');
                cardCanvas.width  = cardW;
                cardCanvas.height = cardH;
                const cardCtx = cardCanvas.getContext('2d');

                cardCtx.fillStyle = 'white';
                cardCtx.fillRect(0, 0, cardW, cardH);

                const leftPx = Math.round(Number(settingsSnapshot.left) * PX_PER_CM);
                const topPx  = Math.round(Number(settingsSnapshot.top)  * PX_PER_CM);
                const photoW = Math.round(Number(settingsSnapshot.width)  * PX_PER_CM);
                const photoH = Math.round(Number(settingsSnapshot.height) * PX_PER_CM);

                const scaleX = photoW / pixels.width;
                const scaleY = photoH / pixels.height;

                const drawX = leftPx + (pixels.x < 0 ? -pixels.x * scaleX : 0);
                const drawY = topPx  + (pixels.y < 0 ? -pixels.y * scaleY : 0);

                const srcX = Math.max(0, pixels.x);
                const srcY = Math.max(0, pixels.y);

                const maxPhotoW = photoW - (pixels.x < 0 ? -pixels.x * scaleX : 0);
                const maxPhotoH = photoH - (pixels.y < 0 ? -pixels.y * scaleY : 0);

                const srcW = Math.min(pixels.width,  maxPhotoW / scaleX);
                const srcH = Math.min(pixels.height, maxPhotoH / scaleY);

                cardCtx.drawImage(
                    rotatedCanvasOrigPhoto,
                    srcX, srcY, srcW, srcH,
                    drawX, drawY, srcW * scaleX, srcH * scaleY
                );

                cards.push(cardCanvas);
            }

            for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
                const pagePhotos = pages[pageIndex];
                const pageStart = pageIndex * perPage;

                const canvas = document.createElement('canvas');
                canvas.width  = sheetW;
                canvas.height = sheetH;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, sheetW, sheetH);

                for (let slot = 0; slot < pagePhotos.length; slot++) {
                    const card = cards[pageStart + slot];
                    if (!card) continue;

                    const col = Math.floor(slot / rows);
                    const row = slot % rows;

                    ctx.drawImage(card, col * cardW, row * cardH);
                }

                ctx.strokeStyle = '#aaa';
                ctx.lineWidth = 1;
                ctx.setLineDash([8, 6]);

                for (let c = 0; c <= cols; c++) {
                    const x = c * cardW;
                    if (x > sheetW) break;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, sheetH);
                    ctx.stroke();
                }

                for (let r = 0; r <= rows; r++) {
                    const y = r * cardH;
                    if (y > sheetH) break;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(sheetW, y);
                    ctx.stroke();
                }

                ctx.setLineDash([]);

                // Увеличиваем loadingCount за лист и даём UI перерисоваться
                setLoadingCount(prev => prev + 1);
                await yieldToUI(40);

                const blob = await canvasToBlob(canvas, outputFormat, 92);

                const ext = outputFormat === 'png' ? 'png' : 'jpeg';
                const fileName = pages.length > 1
                    ? `sheet_${pageIndex + 1}.${ext}`
                    : `${nameOrder}_${nameFormat}.${ext}`;
                zip.file(fileName, blob);
            }
        }

        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, `${nameOrder}_${nameFormat}.zip`);
            setNameOrder('');
            setTimeout(() => setDownloadDone(true), 500);
        });
    };

    const saveCurrentPhoto = async () => {
        const photo = photos[activePhoto];
        if (!photo) return;

        if (!photo.cropData) {
            setUnprocessedAlert([activePhoto + 1]);
            setTimeout(() => setUnprocessedAlert([]), 2000);
            return;
        }

        setIsDownloading(true);
        setDownloadDone(false);

        setDownloadStartTime(Date.now());
        setDownloadElapsed(0);
        setTotalSteps(1);
        setProgressUnit('фото');

        // Даём модалке отрисоваться
        await yieldToUI(40);

        try {
            const settingsSnapshot = { ...activeSettings };

            const img = await new Promise((resolve, reject) => {
                const el = new Image();
                el.crossOrigin = 'anonymous';
                el.onload = () => resolve(el);
                el.onerror = reject;
                el.src = photo.url;
            });

            const { rotation } = photo.cropData;

            const pixels = pixelsRef.current[photo.id]
                || computePixelsFromCropData(photo.cropData);

            if (!pixels) {
                setIsDownloading(false);
                return;
            }

            const rotatedCanvasOrigPhoto = document.createElement('canvas');
            const rotatedOrigPhoto = rotatedCanvasOrigPhoto.getContext('2d');
            const isRotated90 = rotation === 90 || rotation === 270;

            rotatedCanvasOrigPhoto.width  = isRotated90 ? img.height : img.width;
            rotatedCanvasOrigPhoto.height = isRotated90 ? img.width  : img.height;

            rotatedOrigPhoto.translate(rotatedCanvasOrigPhoto.width / 2, rotatedCanvasOrigPhoto.height / 2);
            rotatedOrigPhoto.rotate(((rotation || 0) * Math.PI) / 180);
            rotatedOrigPhoto.drawImage(img, -img.width / 2, -img.height / 2);

            const isPhotoHorizontal = pixels.width > pixels.height;

            const cardWidthCm  = isPhotoHorizontal
                ? Math.max(Number(settingsSnapshot.height), Number(settingsSnapshot.width))
                : Math.min(Number(settingsSnapshot.height), Number(settingsSnapshot.width));
            const cardHeightCm = isPhotoHorizontal
                ? Math.min(Number(settingsSnapshot.height), Number(settingsSnapshot.width))
                : Math.max(Number(settingsSnapshot.height), Number(settingsSnapshot.width));

            const photoIsHorizontal = pixels.width > pixels.height;
            const cardIsHorizontal = cardWidthCm > cardHeightCm;
            const needSwap = photoIsHorizontal !== cardIsHorizontal;

            let pxPerCmX, pxPerCmY;
            if (needSwap) {
                pxPerCmX = pixels.height / cardHeightCm;
                pxPerCmY = pixels.width  / cardWidthCm;
            } else {
                pxPerCmX = pixels.width  / cardWidthCm;
                pxPerCmY = pixels.height / cardHeightCm;
            }

            const leftPx   = Math.round(Number(settingsSnapshot.left)   * pxPerCmX);
            const rightPx  = Math.round(Number(settingsSnapshot.right)  * pxPerCmX);
            const topPx    = Math.round(Number(settingsSnapshot.top)    * pxPerCmY);
            const bottomPx = Math.round(Number(settingsSnapshot.bottom) * pxPerCmY);

            const cardContentW = pixels.width  + leftPx + rightPx;
            const cardContentH = pixels.height + topPx  + bottomPx;

            let pxPerCm;
            if (pixels.width > pixels.height) {
                pxPerCm = Math.max(
                    pixels.height / Number(settingsSnapshot.width),
                    pixels.width  / Number(settingsSnapshot.height)
                );
            } else {
                pxPerCm = Math.max(
                    pixels.width  / Number(settingsSnapshot.width),
                    pixels.height / Number(settingsSnapshot.height)
                );
            }

            let finalSheetW = Math.round(Number(settingsSnapshot.widthList)  * pxPerCm);
            let finalSheetH = Math.round(Number(settingsSnapshot.heightList) * pxPerCm);

            const EPS = 0.02;
            const isSquare = Math.abs(cardContentW - cardContentH) / Math.max(cardContentW, cardContentH) < EPS;
            const isCardPortrait = cardContentH > cardContentW;
            const isSheetPortrait = finalSheetH > finalSheetW;

            if (!isSquare && isCardPortrait !== isSheetPortrait) {
                [finalSheetW, finalSheetH] = [finalSheetH, finalSheetW];
            }

            const canvas = document.createElement('canvas');
            canvas.width  = finalSheetW;
            canvas.height = finalSheetH;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, finalSheetW, finalSheetH);

            const offsetX = leftPx;
            const offsetY = topPx;

            const srcX = Math.max(0, pixels.x);
            const srcY = Math.max(0, pixels.y);

            const drawX = offsetX + (pixels.x < 0 ? -pixels.x : 0);
            const drawY = offsetY + (pixels.y < 0 ? -pixels.y : 0);

            const maxPhotoW = pixels.width  - (pixels.x < 0 ? -pixels.x : 0);
            const maxPhotoH = pixels.height - (pixels.y < 0 ? -pixels.y : 0);

            const srcW = Math.min(pixels.width,  maxPhotoW);
            const srcH = Math.min(pixels.height, maxPhotoH);

            ctx.drawImage(
                rotatedCanvasOrigPhoto,
                srcX, srcY, srcW, srcH,
                drawX, drawY, srcW, srcH
            );

            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 1;
            ctx.setLineDash([8, 6]);

            ctx.beginPath();
            ctx.moveTo(cardContentW, 0);
            ctx.lineTo(cardContentW, finalSheetH);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, cardContentH);
            ctx.lineTo(finalSheetW, cardContentH);
            ctx.stroke();

            ctx.setLineDash([]);

            const blob = await canvasToBlob(canvas, outputFormat, 92);

            const ext = outputFormat === 'png' ? 'png' : 'jpeg';
            const baseName = photos.length > 1
                ? photo.name.split('.')[0]
                : `${nameOrder || 'photo'}_${nameFormat || 'export'}`;
            const fileName = `${baseName}.${ext}`;

            saveAs(blob, fileName);

            setLoadingCount(1);
            setTimeout(() => setDownloadDone(true), 500);
        } catch (err) {
            console.error('Ошибка сохранения фото:', err);
            setIsDownloading(false);
        }
    };

    const handleDoneClose = () => {
        setIsDownloading(false);
        setDownloadDone(false);
        setLoadingCount(0);
        setDownloadStartTime(null);
        setDownloadElapsed(0);
        setTotalSteps(0);
    };

    const progressPercent = totalSteps > 0
        ? Math.min(100, Math.round((loadingCount / totalSteps) * 100))
        : 0;

    const processingPercent = processingTotal > 0
        ? Math.round(((processingTotal - processingCount) / processingTotal) * 100)
        : 0;

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">

            {/* Модалка конвертации HEIC */}
            {convertingCount > 0 && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg flex flex-col items-center gap-4">
                        <div className="text-lg font-medium">Упс, heic попался. Конвертирую...</div>

                        <div className="flex items-center gap-2 text-gray-500">
                            <i className="bi bi-arrow-repeat animate-spin text-teal-700 text-xl"></i>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка обработки превью добавленных фото */}
            {processingTotal > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-2 min-w-[300px]">
                        <div className="text-base font-medium text-gray-700">
                            Добавление фото в редактор...
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-teal-600 h-2.5 rounded-full"
                                style={{ width: `${processingPercent}%` }}
                            />
                        </div>
                        <div className="text-sm text-gray-400">
                            {processingTotal - processingCount} / {processingTotal} фото
                        </div>
                    </div>
                </div>
            )}

            {unprocessedAlert.length > 0 && (
                <div className="fixed bottom-[calc(theme(spacing.16)+theme(spacing.2))] left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-white rounded-xl shadow-lg border border-red-100 px-5 py-4 flex items-start gap-3 min-w-[300px] max-w-[400px]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                            <i className="bi bi-exclamation-triangle text-red-500 text-sm" />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">Не все фото обработаны</div>
                        </div>
                    </div>
                </div>
            )}

            {isDownloading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-2 min-w-[300px]">
                        {!downloadDone ? (
                            <>
                                <div className="text-base font-medium text-gray-700">
                                    Подготовка файлов...
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="text-sm text-gray-400">
                                    {loadingCount} / {totalSteps} {progressUnit}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <i className="bi bi-stopwatch"></i>
                                    {formatElapsed(downloadElapsed)}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                                    <i className="bi bi-check-lg text-green-600 text-2xl" />
                                </div>
                                <div className="text-base font-medium text-gray-700 text-center mt-4">
                                    {photos.length} файлов
                                </div>
                                <div className="text-base font-light text-gray-700 text-center">
                                    Все фото обработаны и скачены
                                </div>
                                <div className="text-xs text-gray-400 text-center flex items-center gap-1">
                                    <i className="bi bi-stopwatch"></i>
                                    Заняло {formatElapsed(downloadElapsed)}
                                </div>
                                <button
                                    onClick={handleDoneClose}
                                    className="px-6 py-2 mt-4 bg-teal-700 text-white rounded-lg hover:bg-teal-900 transition-colors text-sm font-medium"
                                >
                                    ОК
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-1 min-h-0 h-full">
                <div className="flex-[6] min-h-0 h-full">
                    <div className="flex-1 h-full">
                        <CropperMain
                            photos={photos}
                            setPhotos={setPhotos}
                            onSaveCrop={onSaveCrop}
                            handleAddPhotos={handleAddPhotos}
                            activePhoto={activePhoto}
                            setActivePhoto={setActivePhoto}
                            savePhotos={savePhotos}
                            nameOrder={nameOrder}
                            setNameOrder={setNameOrder}
                            setNameFormat={setNameFormat}
                            nameFormat={nameFormat}
                            settingsDB={settingsDB}
                            setSettingsDB={setSettingsDB}
                            activeSettings={activeSettings}
                            setActiveSettings={setActiveSettings}
                            isDownloading={isDownloading}
                            loadingCount={loadingCount}
                            pixelsRef={pixelsRef}
                            outputFormat={outputFormat}
                            setOutputFormat={setOutputFormat}
                            saveCurrentPhoto={saveCurrentPhoto}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Redactor;