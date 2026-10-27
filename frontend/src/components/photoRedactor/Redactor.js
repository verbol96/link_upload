

import React, { useCallback, useEffect, useState } from "react";
import CropperMain from "./CropperMain";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { $host } from "../../http";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import jpeg from "jpeg-js";

// Вспомогательные функции

const formatElapsed = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return minutes === 0
        ? `${remaining} с`
        : `${minutes} мин ${remaining} с`;
};

const yieldToUI = (ms = 40) =>
    new Promise((resolve) => setTimeout(resolve, ms));



const computePixelsFromCropData = (cropData) => {
    if (!cropData) return null;

    const {
        crop,
        cropSize,
        zoom,
        media,
        rotation = 0
    } = cropData;

    if (!media || !cropSize || !crop || !zoom) {
        return null;
    }

    const angle = ((rotation % 360) + 360) % 360;
    const quarterTurn = angle === 90 || angle === 270;

    const naturalW = quarterTurn
        ? media.naturalHeight
        : media.naturalWidth;

    const naturalH = quarterTurn
        ? media.naturalWidth
        : media.naturalHeight;

    const displayW = (
        quarterTurn ? media.height : media.width
    ) * zoom;

    const displayH = (
        quarterTurn ? media.width : media.height
    ) * zoom;

    if (!displayW || !displayH) return null;

    const scaleX = naturalW / displayW;
    const scaleY = naturalH / displayH;

    const width = cropSize.width * scaleX;
    const height = cropSize.height * scaleY;

    return {
        x: (naturalW - width) / 2 - crop.x * scaleX,
        y: (naturalH - height) / 2 - crop.y * scaleY,
        width,
        height
    };
};



const getPixels = (photo) => {
    const pixels =
        photo.cropData?.pixels ||
        computePixelsFromCropData(photo.cropData);

    if (
        !pixels ||
        ![
            pixels.x,
            pixels.y,
            pixels.width,
            pixels.height
        ].every(Number.isFinite)
    ) {
        throw new Error(
            `Нет корректных координат кадра: ${photo.name}`
        );
    }

    if (pixels.width <= 0 || pixels.height <= 0) {
        throw new Error(
            `Неверный размер кадра: ${photo.name}`
        );
    }

    return pixels;
};


const loadImage = (url) =>
    new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () =>
            reject(new Error("Не удалось загрузить изображение"));

        img.src = url;
    });

const createRotatedCanvas = (img, rotation = 0) => {
    const angle = ((rotation % 360) + 360) % 360;
    const quarterTurn = angle === 90 || angle === 270;

    const canvas = document.createElement("canvas");
    canvas.width = quarterTurn ? img.height : img.width;
    canvas.height = quarterTurn ? img.width : img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Ошибка создания холста");

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    return canvas;
};

// Общая функция отрисовки выбранной области.
// Используется для одиночных фото и нескольких фото на листе.

const drawCroppedImage = (
    ctx,
    source,
    pixels,
    destX,
    destY,
    scaleX = 1,
    scaleY = 1
) => {
    const x1 = Math.max(0, pixels.x);
    const y1 = Math.max(0, pixels.y);
    const x2 = Math.min(source.width, pixels.x + pixels.width);
    const y2 = Math.min(source.height, pixels.y + pixels.height);

    const width = x2 - x1;
    const height = y2 - y1;

    if (width <= 0 || height <= 0) {
        return;
    }

    ctx.drawImage(
        source,
        x1,
        y1,
        width,
        height,
        destX + (x1 - pixels.x) * scaleX,
        destY + (y1 - pixels.y) * scaleY,
        width * scaleX,
        height * scaleY
    );
};

const getUniqueFileName = (originalName, ext, usedNames) => {
    const base =
        String(originalName || "photo").replace(/\.[^.]+$/, "") ||
        "photo";

    let name = `${base}.${ext}`;
    let counter = 2;

    while (usedNames.has(name.toLowerCase())) {
        name = `${base}_${counter}.${ext}`;
        counter++;
    }

    usedNames.add(name.toLowerCase());
    return name;
};

const canvasToBlob = async (canvas, format, quality = 92) => {
    if (format === "png") {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Ошибка создания PNG"));
            }, "image/png");
        });
    }

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const encoded = jpeg.encode(
        {
            data: imageData.data,
            width: imageData.width,
            height: imageData.height
        },
        quality
    );

    return new Blob([encoded.data], { type: "image/jpeg" });
};

// Одна фотография на листе

const createSinglePhotoCanvas = (img, photo, settings) => {
    const pixels = getPixels(photo);
    const source = createRotatedCanvas(
        img,
        photo.cropData.rotation || 0
    );

    const horizontal = pixels.width > pixels.height;

    const cardWidthCm = horizontal
        ? Math.max(Number(settings.width), Number(settings.height))
        : Math.min(Number(settings.width), Number(settings.height));

    const cardHeightCm = horizontal
        ? Math.min(Number(settings.width), Number(settings.height))
        : Math.max(Number(settings.width), Number(settings.height));

    const needSwap = horizontal !== (cardWidthCm > cardHeightCm);

    const pxPerCmX = needSwap
        ? pixels.height / cardHeightCm
        : pixels.width / cardWidthCm;

    const pxPerCmY = needSwap
        ? pixels.width / cardWidthCm
        : pixels.height / cardHeightCm;

    const leftPx = Math.round(Number(settings.left) * pxPerCmX);
    const rightPx = Math.round(Number(settings.right) * pxPerCmX);
    const topPx = Math.round(Number(settings.top) * pxPerCmY);
    const bottomPx = Math.round(Number(settings.bottom) * pxPerCmY);

    const cardContentW = pixels.width + leftPx + rightPx;
    const cardContentH = pixels.height + topPx + bottomPx;

    const pxPerCm = horizontal
        ? Math.max(
            pixels.height / Number(settings.width),
            pixels.width / Number(settings.height)
        )
        : Math.max(
            pixels.width / Number(settings.width),
            pixels.height / Number(settings.height)
        );

    let sheetW = Math.round(Number(settings.widthList) * pxPerCm);
    let sheetH = Math.round(Number(settings.heightList) * pxPerCm);

    const isSquare =
        Math.abs(cardContentW - cardContentH) /
        Math.max(cardContentW, cardContentH) < 0.02;

    if (
        !isSquare &&
        (cardContentH > cardContentW) !== (sheetH > sheetW)
    ) {
        [sheetW, sheetH] = [sheetH, sheetW];
    }

    const canvas = document.createElement("canvas");
    canvas.width = sheetW;
    canvas.height = sheetH;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, sheetW, sheetH);

    drawCroppedImage(ctx, source, pixels, leftPx, topPx);

    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);

    ctx.beginPath();
    ctx.moveTo(cardContentW, 0);
    ctx.lineTo(cardContentW, sheetH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, cardContentH);
    ctx.lineTo(sheetW, cardContentH);
    ctx.stroke();

    ctx.setLineDash([]);

    return canvas;
};

// Несколько фотографий на листе

const createCardCanvas = (img, photo, settings, pxPerCm) => {
    const pixels = getPixels(photo);
    const source = createRotatedCanvas(
        img,
        photo.cropData.rotation || 0
    );

    const width = Math.round(
        (
            Number(settings.width) +
            Number(settings.left) +
            Number(settings.right)
        ) * pxPerCm
    );

    const height = Math.round(
        (
            Number(settings.height) +
            Number(settings.top) +
            Number(settings.bottom)
        ) * pxPerCm
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    const photoW = Number(settings.width) * pxPerCm;
    const photoH = Number(settings.height) * pxPerCm;
    const left = Number(settings.left) * pxPerCm;
    const top = Number(settings.top) * pxPerCm;

    drawCroppedImage(
        ctx,
        source,
        pixels,
        left,
        top,
        photoW / pixels.width,
        photoH / pixels.height
    );

    return canvas;
};

const drawCutLines = (
    ctx,
    sheetW,
    sheetH,
    cardW,
    cardH,
    cols,
    rows,
    formatName
) => {
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([20, 80]);

    for (let col = 0; col <= cols; col++) {
        const x = col * cardW;
        if (x > sheetW) break;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, sheetH);
        ctx.stroke();
    }

    const isPoloska = String(formatName || "")
        .toLowerCase()
        .includes("полоска");

    if (!isPoloska) {
        for (let row = 0; row <= rows; row++) {
            const y = row * cardH;
            if (y > sheetH) break;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(sheetW, y);
            ctx.stroke();
        }
    }

    ctx.setLineDash([]);
};

// Основной компонент

const Redactor = () => {
    const [photos, setPhotos] = useState([]);
    const [activePhoto, setActivePhoto] = useState(0);

    const [loadingCount, setLoadingCount] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadDone, setDownloadDone] = useState(false);

    const [nameOrder, setNameOrder] = useState("");
    const [nameFormat, setNameFormat] = useState("");

    const [settingsDB, setSettingsDB] = useState([]);
    const [activeSettings, setActiveSettings] = useState(null);

    const [unprocessedAlert, setUnprocessedAlert] = useState([]);
    const [outputFormat, setOutputFormat] = useState("jpeg");

    const [totalSteps, setTotalSteps] = useState(0);
    const [progressUnit, setProgressUnit] = useState("фото");

    const [downloadStartTime, setDownloadStartTime] = useState(null);
    const [downloadElapsed, setDownloadElapsed] = useState(0);

    const [convertingCount, setConvertingCount] = useState(0);
    const [processingCount, setProcessingCount] = useState(0);
    const [processingTotal, setProcessingTotal] = useState(0);

    // Загрузка настроек

    useEffect(() => {
        const getSettingEditor = async () => {
            try {
                let { data } = await $host.get(
                    "api/settings/getSettingEditor"
                );

                if (!data.length) {
                    const defaultSetting = {
                        name: "10x15",
                        width: 10,
                        height: 15,
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        widthList: 10,
                        heightList: 15
                    };

                    await $host.put(
                        "api/settings/changeSettingEditor",
                        defaultSetting
                    );

                    const response = await $host.get(
                        "api/settings/getSettingEditor"
                    );

                    data = response.data;
                }

                const sorted = _.sortBy(data, "name");

                setSettingsDB(sorted);
                setActiveSettings(sorted[0] || null);
                setNameFormat(sorted[0]?.name || "");
            } catch (error) {
                console.error("Ошибка загрузки настроек:", error);
            }
        };

        getSettingEditor();
    }, []);

    // Секундомер

    useEffect(() => {
        if (!isDownloading || downloadDone || !downloadStartTime) {
            return;
        }

        const interval = setInterval(() => {
            setDownloadElapsed(
                Math.floor((Date.now() - downloadStartTime) / 1000)
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [isDownloading, downloadDone, downloadStartTime]);

    // Миниатюры

    const createThumbnail = (file, maxSize = 200) =>
        new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const ratio = Math.min(
                    1,
                    maxSize / Math.max(img.width, img.height)
                );

                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * ratio);
                canvas.height = Math.round(img.height * ratio);

                const ctx = canvas.getContext("2d");
                ctx.drawImage(
                    img,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                URL.revokeObjectURL(url);

                canvas.toBlob((blob) => {
                    resolve(blob ? URL.createObjectURL(blob) : null);
                }, "image/jpeg", 0.85);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };

            img.src = url;
        });

    // Конвертация HEIC

    const getLibheif = async () => {
        const mod = await import("libheif-js/wasm-bundle");
        return mod.default || mod;
    };

    const convertHeic = async (file) => {
        const libheif = await getLibheif();
        const buffer = await file.arrayBuffer();

        const decoder = new libheif.HeifDecoder();
        const images = decoder.decode(new Uint8Array(buffer));

        if (!images?.length) {
            throw new Error("Не удалось декодировать HEIC");
        }

        const image = images[0];
        const width = image.get_width();
        const height = image.get_height();

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        let ctx;

        try {
            ctx = canvas.getContext("2d", {
                colorSpace: "display-p3"
            });
        } catch {
            ctx = null;
        }

        if (!ctx) {
            ctx = canvas.getContext("2d");
        }

        const imageData = ctx.createImageData(width, height);

        await new Promise((resolve, reject) => {
            image.display(imageData, (result) => {
                if (result) resolve(result);
                else reject(new Error("Ошибка отображения HEIC"));
            });
        });

        ctx.putImageData(imageData, 0, 0);

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Ошибка конвертации HEIC"));
            }, "image/jpeg", 0.95);
        });
    };

    // Добавление фотографий

    const handleAddPhotos = async (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        const isSafari =
            /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        setConvertingCount(files.length);
        await new Promise(requestAnimationFrame);

        const processedFiles = await Promise.all(
            files.map(async (file) => {
                const isHeic =
                    /\.(heic|heif)$/i.test(file.name) ||
                    file.type === "image/heic" ||
                    file.type === "image/heif";

                let result = file;

                if (isHeic && !isSafari) {
                    try {
                        const blob = await convertHeic(file);
                        const name = file.name.replace(
                            /\.(heic|heif)$/i,
                            ".jpeg"
                        );

                        result = new File([blob], name, {
                            type: "image/jpeg"
                        });
                    } catch (error) {
                        console.error(
                            "Ошибка конвертации HEIC:",
                            error
                        );
                    }
                }

                setConvertingCount((prev) => Math.max(0, prev - 1));
                return result;
            })
        );

        setProcessingTotal(processedFiles.length);
        setProcessingCount(processedFiles.length);

        await new Promise(requestAnimationFrame);

        const newPhotos = [];

        for (const file of processedFiles) {
            const thumb = await createThumbnail(file);

            newPhotos.push({
                id: uuidv4(),
                url: URL.createObjectURL(file),
                thumb,
                name: file.name,
                size: file.size,
                cropData: null
            });

            setProcessingCount((prev) => Math.max(0, prev - 1));
            await new Promise(requestAnimationFrame);
        }

        setPhotos((prev) => [...prev, ...newPhotos]);
        setActivePhoto(0);

        event.target.value = "";
        setProcessingCount(0);
        setProcessingTotal(0);
    };

    // Сохранение координат кадра


const onSaveCrop = useCallback((photoId, newData) => {
    setPhotos((prev) =>
        prev.map((photo) =>
            photo.id === photoId
                ? {
                    ...photo,
                    cropData: {
                        ...photo.cropData,
                        ...newData
                    }
                }
                : photo
        )
    );
}, []);


    // Запуск прогресса

    const beginDownload = (steps, unit) => {
        setIsDownloading(true);
        setDownloadDone(false);
        setLoadingCount(0);
        setTotalSteps(steps);
        setProgressUnit(unit);
        setDownloadStartTime(Date.now());
        setDownloadElapsed(0);
    };

    // Скачивание всей партии

    const savePhotos = async () => {
        if (isDownloading || !photos.length || !activeSettings) {
            return;
        }

        const unprocessed = photos
            .map((photo, index) =>
                !photo.cropData ? index + 1 : null
            )
            .filter(Boolean);

        if (unprocessed.length) {
            setUnprocessedAlert(unprocessed);
            setTimeout(() => setUnprocessedAlert([]), 2000);
            return;
        }

        const snapshot = photos.map((photo) => ({
            ...photo,
            cropData: {
                ...photo.cropData,
                pixels: photo.cropData.pixels
                    ? { ...photo.cropData.pixels }
                    : null
            }
        }));

        const settings = { ...activeSettings };

        const pxPerCm = 300;

        const cardW = Math.round(
            (
                Number(settings.width) +
                Number(settings.left) +
                Number(settings.right)
            ) * pxPerCm
        );

        const cardH = Math.round(
            (
                Number(settings.height) +
                Number(settings.top) +
                Number(settings.bottom)
            ) * pxPerCm
        );

        const sheetW = Math.round(
            Number(settings.widthList) * pxPerCm
        );

        const sheetH = Math.round(
            Number(settings.heightList) * pxPerCm
        );

        if (
            ![cardW, cardH, sheetW, sheetH].every(
                (value) => Number.isFinite(value) && value > 0
            )
        ) {
            window.alert("Некорректные размеры формата печати");
            return;
        }

        const cols = Math.max(1, Math.floor(sheetW / cardW));
        const rows = Math.max(1, Math.floor(sheetH / cardH));
        const perPage = cols * rows;
        const pagesCount = Math.ceil(snapshot.length / perPage);

        beginDownload(
            perPage === 1 ? snapshot.length : pagesCount,
            perPage === 1 ? "фото" : "листов"
        );

        await yieldToUI();

        try {
            const zip = new JSZip();
            const usedNames = new Set();

            const ext = outputFormat === "png" ? "png" : "jpeg";

            if (perPage === 1) {
                // Одна фотография на листе

                for (const photo of snapshot) {
                    const img = await loadImage(photo.url);

                    const canvas = createSinglePhotoCanvas(
                        img,
                        photo,
                        settings
                    );

                    const blob = await canvasToBlob(
                        canvas,
                        outputFormat,
                        92
                    );

                    const base = snapshot.length > 1
                        ? photo.name
                        : `${nameOrder}_${nameFormat}`;

                    const fileName = getUniqueFileName(
                        base,
                        ext,
                        usedNames
                    );

                    zip.file(fileName, blob);

                    setLoadingCount((prev) => prev + 1);
                    await yieldToUI();
                }
            } else {
                // Несколько фотографий на листе

                for (let page = 0; page < pagesCount; page++) {
                    const canvas = document.createElement("canvas");
                    canvas.width = sheetW;
                    canvas.height = sheetH;

                    const ctx = canvas.getContext("2d");
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, sheetW, sheetH);

                    for (let slot = 0; slot < perPage; slot++) {
                        const index = page * perPage + slot;
                        const photo = snapshot[index];

                        if (!photo) break;

                        const img = await loadImage(photo.url);

                        const card = createCardCanvas(
                            img,
                            photo,
                            settings,
                            pxPerCm
                        );

                        const col = Math.floor(slot / rows);
                        const row = slot % rows;

                        ctx.drawImage(
                            card,
                            col * cardW,
                            row * cardH
                        );

                        await yieldToUI(0);
                    }

                    drawCutLines(
                        ctx,
                        sheetW,
                        sheetH,
                        cardW,
                        cardH,
                        cols,
                        rows,
                        settings.name
                    );

                    const blob = await canvasToBlob(
                        canvas,
                        outputFormat,
                        92
                    );

                    const base = pagesCount > 1
                        ? `sheet_${page + 1}`
                        : `${nameOrder}_${nameFormat}`;

                    zip.file(
                        getUniqueFileName(base, ext, usedNames),
                        blob
                    );

                    setLoadingCount((prev) => prev + 1);
                    await yieldToUI();
                }
            }

            const content = await zip.generateAsync({
                type: "blob"
            });

            saveAs(content, `${nameOrder}_${nameFormat}.zip`);
            setNameOrder("");
            setDownloadDone(true);
        } catch (error) {
            console.error("Ошибка экспорта фотографий:", error);
            window.alert(`Ошибка сохранения: ${error.message}`);
            setIsDownloading(false);
        }
    };

    // Скачивание одной фотографии

    const saveCurrentPhoto = async () => {
        if (isDownloading) return;

        const photo = photos[activePhoto];
        if (!photo || !activeSettings) return;

        if (!photo.cropData) {
            setUnprocessedAlert([activePhoto + 1]);
            setTimeout(() => setUnprocessedAlert([]), 2000);
            return;
        }

        beginDownload(1, "фото");
        await yieldToUI();

        try {
            const img = await loadImage(photo.url);

            const canvas = createSinglePhotoCanvas(
                img,
                photo,
                { ...activeSettings }
            );

            const blob = await canvasToBlob(
                canvas,
                outputFormat,
                92
            );

            const ext = outputFormat === "png" ? "png" : "jpeg";

            const base = photos.length > 1
                ? photo.name
                : `${nameOrder || "photo"}_${nameFormat || "export"}`;

            const fileName = getUniqueFileName(
                base,
                ext,
                new Set()
            );

            saveAs(blob, fileName);

            setLoadingCount(1);
            setDownloadDone(true);
        } catch (error) {
            console.error("Ошибка сохранения фотографии:", error);
            window.alert(`Ошибка сохранения: ${error.message}`);
            setIsDownloading(false);
        }
    };

    // Закрытие окна прогресса

    const handleDoneClose = () => {
        setIsDownloading(false);
        setDownloadDone(false);
        setLoadingCount(0);
        setDownloadStartTime(null);
        setDownloadElapsed(0);
        setTotalSteps(0);
    };

    const progressPercent = totalSteps > 0
        ? Math.min(
            100,
            Math.round((loadingCount / totalSteps) * 100)
        )
        : 0;

    const processingPercent = processingTotal > 0
        ? Math.round(
            ((processingTotal - processingCount) / processingTotal) * 100
        )
        : 0;

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
            {/* Конвертация HEIC */}
            {convertingCount > 0 && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg flex flex-col items-center gap-4">
                        <div className="text-lg font-medium">
                            Упс, heic попался. Конвертирую...
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <i className="bi bi-arrow-repeat animate-spin text-teal-700 text-xl" />
                        </div>
                    </div>
                </div>
            )}

            {/* Создание миниатюр */}
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

            {/* Предупреждение */}
            {unprocessedAlert.length > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-white rounded-xl shadow-lg border border-red-100 px-5 py-4 flex items-start gap-3 min-w-[300px]">
                        <i className="bi bi-exclamation-triangle text-red-500" />
                        <span className="text-sm font-medium text-gray-800">
                            Не все фото обработаны
                        </span>
                    </div>
                </div>
            )}

            {/* Скачивание */}
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
                                    <i className="bi bi-stopwatch" />
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
                                    Все фото обработаны и скачаны
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <i className="bi bi-stopwatch" />
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

            {/* Основной редактор */}
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
