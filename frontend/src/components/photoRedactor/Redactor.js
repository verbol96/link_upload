import React, { useEffect, useRef, useState } from "react";
import CropperMain from "./CropperMain"
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { $host } from '../../http';
import _ from 'lodash';


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

    // загрузка фото
    const handleAddPhotos = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.map((file, i) => ({
            id: Date.now() + i,
            url: URL.createObjectURL(file),
            name: file.name,
            cropData: null
        }));
        setPhotos((prev) => [...prev, ...newPhotos]);
        setActivePhoto(0);
    };

    // сохранение изменений кропа
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

    // ФИКС: вычисление pixels из cropData (fallback, если ref пуст)
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

    const zip = new JSZip();

    const images = await Promise.all(
        photos.map(photo =>
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
        (Number(activeSettings.width) + Number(activeSettings.left) + Number(activeSettings.right)) * PX_PER_CM
    );
    const cardH = Math.round(
        (Number(activeSettings.height) + Number(activeSettings.top) + Number(activeSettings.bottom)) * PX_PER_CM
    );

    const sheetW = Math.round(Number(activeSettings.widthList)  * PX_PER_CM);
    const sheetH = Math.round(Number(activeSettings.heightList) * PX_PER_CM);

    const cols = Math.max(1, Math.floor(sheetW / cardW));
    const rows = Math.max(1, Math.floor(sheetH / cardH));
    const perPage = cols * rows;

    // =====================================================
    // РЕЖИМ A: perPage === 1 — 1 фото на лист, без сжатия
    // =====================================================
    if (perPage === 1) {
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const img = images[i];
            const { rotation } = photo.cropData;

            const pixels = pixelsRef.current[photo.id]
                || computePixelsFromCropData(photo.cropData);
            //console.log(pixels)
            if (!pixels) continue;

            setLoadingCount(prev => prev + 1);

            // Поворот оригинала
            const rotatedCanvasOrigPhoto = document.createElement('canvas');
            const rotatedOrigPhoto = rotatedCanvasOrigPhoto.getContext('2d');
            const isRotated90 = rotation === 90 || rotation === 270;
            //console.log(rotation)

            rotatedCanvasOrigPhoto.width  = isRotated90 ? img.height : img.width;
            rotatedCanvasOrigPhoto.height = isRotated90 ? img.width  : img.height;
            //console.log(rotatedCanvasOrigPhoto.width, rotatedCanvasOrigPhoto.height )

            rotatedOrigPhoto.translate(rotatedCanvasOrigPhoto.width / 2, rotatedCanvasOrigPhoto.height / 2);
            rotatedOrigPhoto.rotate(((rotation || 0) * Math.PI) / 180);
            rotatedOrigPhoto.drawImage(img, -img.width / 2, -img.height / 2);

            // Ориентация кропа
            const isPhotoHorizontal = pixels.width > pixels.height;
            //console.log(rotatedCanvasOrigPhoto.width, rotatedCanvasOrigPhoto.height)
            
            const cardWidthCm  = isPhotoHorizontal ? Math.max(Number(activeSettings.height),Number(activeSettings.width)) : Math.min(Number(activeSettings.height),Number(activeSettings.width));
            const cardHeightCm = isPhotoHorizontal ? Math.min(Number(activeSettings.height),Number(activeSettings.width)) : Math.max(Number(activeSettings.height),Number(activeSettings.width));

            
            // Ориентация: фото повёрнуто или нет?
            const photoIsHorizontal = pixels.width > pixels.height;
            const cardIsHorizontal = cardWidthCm > cardHeightCm;

            // Если ориентации совпадают — прямое соотношение
            // Если не совпадают — нужно свапнуть
            const needSwap = photoIsHorizontal !== cardIsHorizontal;

            let pxPerCmX, pxPerCmY;

            if (needSwap) {
                pxPerCmX = pixels.height / cardHeightCm;
                pxPerCmY = pixels.width  / cardWidthCm;
            } else {
                pxPerCmX = pixels.width  / cardWidthCm;
                pxPerCmY = pixels.height / cardHeightCm;
            }
            

            const leftPx   = Math.round(Number(activeSettings.left)   * pxPerCmX);
            const rightPx  = Math.round(Number(activeSettings.right)  * pxPerCmX);
            const topPx    = Math.round(Number(activeSettings.top)    * pxPerCmY);
            const bottomPx = Math.round(Number(activeSettings.bottom) * pxPerCmY);

            const cardContentW = pixels.width  + leftPx + rightPx;
            const cardContentH = pixels.height + topPx  + bottomPx;

            // pxPerCm от карточки
            let pxPerCm
            if(pixels.width>pixels.height){
                pxPerCm = Math.max(
                pixels.height / Number(activeSettings.width),
                pixels.width / Number(activeSettings.height)
            );
            }else{
                pxPerCm = Math.max(
                pixels.width / Number(activeSettings.width),
                pixels.height / Number(activeSettings.height)
            );
            }
            

            // Лист = размер из настроек × pxPerCm
            let finalSheetW = Math.round(Number(activeSettings.widthList)  * pxPerCm);
            let finalSheetH = Math.round(Number(activeSettings.heightList) * pxPerCm);

            // Ориентация под карточку (если карточка не квадратная)
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
            //console.log(canvas.width, canvas.height)

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, finalSheetW, finalSheetH);

            // Карточка в левом верхнем углу
            const offsetX = leftPx;
            const offsetY = topPx;

            const srcX = Math.max(0, pixels.x);
            const srcY = Math.max(0, pixels.y);

            const drawX = offsetX + (pixels.x < 0 ? -pixels.x : 0);
            const drawY = offsetY + (pixels.y < 0 ? -pixels.y : 0);
            //console.log({drawX,drawY})

            const maxPhotoW = pixels.width  - (pixels.x < 0 ? -pixels.x : 0);
            const maxPhotoH = pixels.height - (pixels.y < 0 ? -pixels.y : 0);

            const srcW = Math.min(pixels.width,  maxPhotoW);
            const srcH = Math.min(pixels.height, maxPhotoH);
            //console.log({srcW,srcH})

            ctx.drawImage(
                rotatedCanvasOrigPhoto,
                srcX, srcY, srcW, srcH,
                drawX, drawY, srcW, srcH
            );

            // Линии реза от края до края листа
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 1;
            ctx.setLineDash([8, 6]);

            // Правая граница карточки
            ctx.beginPath();
            ctx.moveTo(cardContentW, 0);
            ctx.lineTo(cardContentW, finalSheetH);
            ctx.stroke();

            // Нижняя граница карточки
            ctx.beginPath();
            ctx.moveTo(0, cardContentH);
            ctx.lineTo(finalSheetW, cardContentH);
            ctx.stroke();

            ctx.setLineDash([]);
            

            const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
            const quality = outputFormat === 'png' ? undefined : 0.92;

            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, mimeType, quality)
            );

            const ext = outputFormat === 'png' ? 'png' : 'jpg';
            const fileName = photos.length > 1
                ? `${photo.name.split('.')[0]}.${ext}`
                : `${nameOrder}_${nameFormat}.${ext}`;

            zip.file(fileName, blob);
        }
    } else {
        // =====================================================
        // РЕЖИМ B: perPage >= 2 — несколько фото на лист
        // =====================================================
        const pages = [];
        for (let i = 0; i < photos.length; i += perPage) {
            pages.push(photos.slice(i, i + perPage));
        }

        const cards = [];

        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const img = images[i];
            const { rotation } = photo.cropData;

            const pixels = pixelsRef.current[photo.id]
                || computePixelsFromCropData(photo.cropData);

            if (!pixels) continue;

            setLoadingCount(prev => prev + 1);

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

            const leftPx = Math.round(Number(activeSettings.left) * PX_PER_CM);
            const topPx  = Math.round(Number(activeSettings.top)  * PX_PER_CM);
            const photoW = Math.round(Number(activeSettings.width)  * PX_PER_CM);
            const photoH = Math.round(Number(activeSettings.height) * PX_PER_CM);

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

            // ФИКС: сначала столбцы
            for (let slot = 0; slot < pagePhotos.length; slot++) {
                const card = cards[pageStart + slot];
                if (!card) continue;

                const col = Math.floor(slot / rows);
                const row = slot % rows;

                ctx.drawImage(card, col * cardW, row * cardH);
            }

            // Линии реза
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

            const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
            const quality = outputFormat === 'png' ? undefined : 0.92;

            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, mimeType, quality)
            );

            // И расширение файла
            const ext = outputFormat === 'png' ? 'png' : 'jpg';
            const fileName = pages.length > 1
                ? `sheet_${pageIndex + 1}.${ext}`
                : `${nameOrder}_${nameFormat}.${ext}`;
            zip.file(fileName, blob);
        }
    }

    zip.generateAsync({ type: 'blob' }).then(content => {
        saveAs(content, `${nameOrder}_${nameFormat}.zip`);
        setTimeout(() => setDownloadDone(true), 500);
    });
};

    const handleDoneClose = () => {
        setIsDownloading(false);
        setDownloadDone(false);
        setLoadingCount(0);
    };

    const progressPercent = photos.length > 0
        ? Math.min(100, Math.round((loadingCount / photos.length) * 100))
        : 0;

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
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
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="text-sm text-gray-400">
                                    {loadingCount} / {photos.length} фото
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
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Redactor;