import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import ModalSettings from './ModalSettings';
import ListPhoto from './ListPhoto';
import PhotoCarousel from './PhotoCarousel';

const CropperMain = ({
    photos, setPhotos, onSaveCrop, handleAddPhotos, setActivePhoto, activePhoto,
    savePhotos, saveCurrentPhoto,
    nameOrder, setNameOrder, setNameFormat,
    settingsDB, setSettingsDB, activeSettings, setActiveSettings,
    pixelsRef, outputFormat, setOutputFormat
}) => {

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [zoomDef, setZoomDef] = useState(1);
    const [cropSize, setCropSize] = useState({ width: 400, height: 400 });
    const [rotation, setRotation] = useState(0);
    const [fieldsWhite, setFieldsWhite] = useState(false);
    const [media, setMedia] = useState();

    const [withFrame, setWithFrame] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const cropRef = useRef();
    const isSwitchingRef = useRef(false);

    const clearPhotos = useCallback(() => {
        setPhotos([]);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setZoomDef(1);
        setCropSize({ width: 400, height: 400 });
        setRotation(0);
        setFieldsWhite(false);
        setNameOrder('');
        pixelsRef.current = {};
    }, [setPhotos, setNameOrder, pixelsRef]);

    // функция вычисления pixels из crop, cropSize, zoom, media
    const computePixels = (cropValue) => {
        if (!media || !cropSize) return null;

        const displayW = media.width * zoom;
        const displayH = media.height * zoom;

        const kX = media.naturalWidth / displayW;
        const kY = media.naturalHeight / displayH;

        const pixelsW = cropSize.width * kX;
        const pixelsH = cropSize.height * kY;

        const x = (media.naturalWidth - pixelsW) / 2 - cropValue.x * kX;
        const y = (media.naturalHeight - pixelsH) / 2 - cropValue.y * kY;

        return { x, y, width: pixelsW, height: pixelsH };
    };

    // При загрузке изображения — инициализация
    // если несколько на листе, то изначлаьный кроп по настройкам
    const onMediaLoaded = useCallback((mediaSize) => {
        setMedia(mediaSize);

        if (photos[activePhoto]?.cropData?.cropSize !== undefined) {
            // уже инициализировано
        } else {
            setRotation(0);
            if (!cropRef.current?.containerRect) return;

            const indexDown = 0.85;
            let k, kef, sizeFrame;
            if ((activeSettings.top + activeSettings.bottom) > (activeSettings.left + activeSettings.right)) {
                k = (Math.max(activeSettings.top, activeSettings.bottom));
                kef = activeSettings.height / (Number(activeSettings.height) + 2 * k);
                sizeFrame = cropRef.current.containerRect.height * kef * indexDown;
            } else {
                k = (Math.max(activeSettings.left, activeSettings.right));
                kef = activeSettings.width / (Number(activeSettings.width) + 2 * k);
                sizeFrame = cropRef.current.containerRect.width * kef * indexDown;
            }

            // Определяем, сколько фото будет на листе
            const cardW = Number(activeSettings.width) + Number(activeSettings.left) + Number(activeSettings.right);
            const cardH = Number(activeSettings.height) + Number(activeSettings.top) + Number(activeSettings.bottom);

            const sheetW = Number(activeSettings.widthList);
            const sheetH = Number(activeSettings.heightList);

            const cols = Math.max(1, Math.floor(sheetW / cardW));
            const rows = Math.max(1, Math.floor(sheetH / cardH));
            const perPage = cols * rows;

            // Если фото несколько на листе — фиксируем ориентацию кропа под карточку
            const shouldFixOrientation = perPage > 1;

            let x, y;
            if (mediaSize.width > mediaSize.height) {
                x = sizeFrame;
                y = sizeFrame * activeSettings.width / activeSettings.height;
            } else {
                x = sizeFrame * activeSettings.width / activeSettings.height;
                y = sizeFrame;
            }

            // Если несколько фото на лист и ориентации не совпадают — меняем кроп местами
            if (shouldFixOrientation) {
                const photoIsHorizontal = mediaSize.width > mediaSize.height;
                const cardIsHorizontal = Number(activeSettings.width) > Number(activeSettings.height);

                if (photoIsHorizontal !== cardIsHorizontal) {
                    [x, y] = [y, x];
                }
            }

            const valueZoom = Math.max(
                x / mediaSize.width,
                y / mediaSize.height,
            );

            const newCropData = { width: x, height: y };

            setCropSize(newCropData);
            requestAnimationFrame(() => {
                setTimeout(() => {
                    setCrop({ x: 0, y: 0 });
                    setZoom(valueZoom);
                }, 30);

                setZoomDef(valueZoom);
                setMedia(mediaSize);
                setFieldsWhite(false);

                onSaveCrop(photos[activePhoto].id, {
                    zoom: valueZoom,
                    zoomDef: valueZoom,
                    cropSize: newCropData,
                    crop: { x: 0, y: 0 },
                    media: mediaSize,
                    rotation: 0,
                    fieldsWhite: false
                });
            });
        }
    }, [photos, activePhoto, activeSettings, onSaveCrop]);

    const changePhoto = useCallback((index) => {
        if (index < 0 || index >= photos.length) return;
        if (index === activePhoto) return;

        isSwitchingRef.current = true;

        // Сохраняем текущее состояние в cropData (pixels уже в ref)
        const currentData = {
            cropSize,
            crop,
            zoom,
            zoomDef,
            rotation,
            fieldsWhite,
            media,
            pixels: pixelsRef.current[photos[activePhoto]?.id]
        };

        const newPhoto = photos[index];
        const data = newPhoto?.cropData;

        setPhotos(prev => prev.map((photo, idx) =>
            idx === activePhoto ? { ...photo, cropData: currentData } : photo
        ));

        if (data) {
            setCropSize(data.cropSize);
            setTimeout(() => {
                setZoom(data.zoom);
                setCrop(data.crop);
            }, 30);
            setZoomDef(data.zoomDef);
            setRotation(data.rotation);
            setFieldsWhite(data.fieldsWhite);
            setMedia(data.media);
        }

        setActivePhoto(index);

        setTimeout(() => {
            isSwitchingRef.current = false;
        }, 200);

    }, [photos, activePhoto, cropSize, crop, zoom, zoomDef, rotation, fieldsWhite, media, setPhotos, setActivePhoto, pixelsRef]);

    // onCropChange — вызывается сразу, вычисляем pixels здесь
    const onCropChange = (newCrop) => {
        setCrop(newCrop);

        if (!photos[activePhoto]) return;

        const computed = computePixels(newCrop);
        if (computed) {
            pixelsRef.current[photos[activePhoto].id] = computed;
        }
    };

    const onZoomChange = (newZoom) => {
        setZoom(newZoom);
    };

    // onCropComplete — сохраняем остальные настройки в cropData
    const onCropComplete = useCallback(
        (_croppedArea, croppedAreaPixels) => {
            if (!photos[activePhoto]) return;

            pixelsRef.current[photos[activePhoto].id] = croppedAreaPixels;

            onSaveCrop(photos[activePhoto].id, {
                crop,
                cropSize,
                zoom,
                zoomDef,
                rotation,
                fieldsWhite,
                media,
                width: activeSettings?.width,
                height: activeSettings?.height,
                top: activeSettings?.top,
                bottom: activeSettings?.bottom,
                left: activeSettings?.left,
                right: activeSettings?.right,
                widthList: activeSettings?.widthList,
                heightList: activeSettings?.heightList,
            });
        },
        [photos, activePhoto, crop, cropSize, zoom, zoomDef, rotation, fieldsWhite, media, onSaveCrop, activeSettings, pixelsRef]
    );

    const changeSelect = (value) => {
        const selectedSettings = settingsDB.find(el => el.name === value);
        if (selectedSettings) {

            setActiveSettings(selectedSettings);
            setNameFormat(selectedSettings.name);

            setPhotos(prev => prev.map(el => ({
                ...el,
                cropData: null
            })));

            pixelsRef.current = {};

            if (photos.length === 1) {
                clearPhotos();
                return;
            }

            if (activePhoto !== 0) setActivePhoto(0);
            else {
                setActivePhoto(1);
                setTimeout(() => {
                    setActivePhoto(0);
                }, 150);
            }

        }
    };

    const addField = useCallback(() => {
        if (!media || !cropSize) return;
        const isRotated90 = rotation === 90 || rotation === 270;
        const eW = isRotated90 ? media.height : media.width;
        const eH = isRotated90 ? media.width : media.height;

        if (!fieldsWhite) {
            const value = Math.min(cropSize.width / eW, cropSize.height / eH);
            setTimeout(() => setCrop({ x: 0, y: 0 }), 5);
            setZoom(value);
            onSaveCrop(photos[activePhoto].id, { crop: { x: 0, y: 0 }, zoom: value, fieldsWhite: true });
        } else {
            const value = Math.max(cropSize.width / eW, cropSize.height / eH);
            setZoom(value);
            setCrop({ x: 0, y: 0 });
            onSaveCrop(photos[activePhoto].id, { crop: { x: 0, y: 0 }, zoom: value, fieldsWhite: false });
        }
        setFieldsWhite(!fieldsWhite);
    }, [media, cropSize, rotation, fieldsWhite, photos, activePhoto, onSaveCrop]);

    const minZoom = (currentFieldsWhite) => {
        if (!media || !cropSize) return 0.1;
        const isRotated90 = rotation === 90 || rotation === 270;
        const effectiveMediaW = isRotated90 ? media.height : media.width;
        const effectiveMediaH = isRotated90 ? media.width : media.height;

        if (currentFieldsWhite) {
            return Math.min(
                cropSize.width / effectiveMediaW,
                cropSize.height / effectiveMediaH,
            );
        } else {
            return Math.max(
                cropSize.width / effectiveMediaW,
                cropSize.height / effectiveMediaH,
            );
        }
    };

    const maxZoom = () => {
        if (fieldsWhite) return zoomDef;
        else return 3 * zoomDef;
    };

    const RotationImg = useCallback((value) => {
        let newRotation = (rotation + 90 * value) % 360;
        if (newRotation < 0) newRotation += 360;

        setRotation(newRotation);

        if (media && cropSize) {
            const isRotating90 = (newRotation === 90 || newRotation === 270);

            const effectiveMediaW = isRotating90 ? media.height : media.width;
            const effectiveMediaH = isRotating90 ? media.width : media.height;

            const newZoom = Math.max(
                cropSize.width / effectiveMediaW,
                cropSize.height / effectiveMediaH
            );

            setCrop({ x: 0, y: 0 });

            setTimeout(() => {
                setZoom(newZoom);
                setZoomDef(newZoom);
            }, 30);

            if (photos[activePhoto]) {
                onSaveCrop(photos[activePhoto].id, {
                    rotation: newRotation,
                    crop: { x: 0, y: 0 },
                    zoom: newZoom,
                    zoomDef: newZoom
                });
            }
        } else {
            if (photos[activePhoto]) {
                onSaveCrop(photos[activePhoto].id, { rotation: newRotation });
            }
        }
    }, [rotation, media, cropSize, photos, activePhoto, onSaveCrop]);

    const RotationAspect = useCallback(() => {
        // Определяем, сколько фото будет на листе
        const cardW = Number(activeSettings.width) + Number(activeSettings.left) + Number(activeSettings.right);
        const cardH = Number(activeSettings.height) + Number(activeSettings.top) + Number(activeSettings.bottom);
        const sheetW = Number(activeSettings.widthList);
        const sheetH = Number(activeSettings.heightList);
        const cols = Math.max(1, Math.floor(sheetW / cardW));
        const rows = Math.max(1, Math.floor(sheetH / cardH));
        const perPage = cols * rows;

        // Если фото несколько на листе — не даём менять ориентацию
        if (perPage > 1) return;

        const x = cropSize.width;
        const y = cropSize.height;

        const newCropSize = { width: y, height: x };
        const resetCrop = { x: 0, y: 0 };

        const newZoom = media
            ? Math.max(newCropSize.width / media.width, newCropSize.height / media.height)
            : zoom;

        setCropSize(newCropSize);
        setCrop(resetCrop);

        setTimeout(() => {
            setZoom(newZoom);
            setZoomDef(newZoom);
        }, 30);

        onSaveCrop(photos[activePhoto].id, {
            cropSize: newCropSize,
            crop: resetCrop,
            zoom: newZoom,
            zoomDef: newZoom
        });
    }, [cropSize, media, zoom, photos, activePhoto, onSaveCrop, activeSettings]);
    
    const cropCenter = (value) => {
        const position = { ...crop };

        if (value === 'x') {
            position.x = 0;
        } else if (value === 'y') {
            position.y = 0;
        }

        setCrop(position);
        onSaveCrop(photos[activePhoto].id, { crop: position });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (photos.length === 0) return;

            // пробел — белые поля
            if (e.key === ' ') {
                e.preventDefault();
                addField();
                return;
            }

            if (e.key === 'ArrowLeft' && activePhoto > 0) {
                e.preventDefault();
                changePhoto(activePhoto - 1);
            } else if (e.key === 'ArrowRight' && activePhoto < photos.length - 1) {
                e.preventDefault();
                changePhoto(activePhoto + 1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                RotationImg(-1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                RotationAspect();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePhoto, photos.length, changePhoto, addField, RotationAspect, RotationImg]);

    const [showPhotoList, setShowPhotoList] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const touchStartX = useRef(null);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        const SWIPE_THRESHOLD = 50;

        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0 && activePhoto < photos.length - 1) {
                changePhoto(activePhoto + 1);
            } else if (diff < 0 && activePhoto > 0) {
                changePhoto(activePhoto - 1);
            }
        }

        touchStartX.current = null;
    };

    return (
        <>
            <div className="h-full bg-white flex flex-col md:flex-row">

                {/* СПИСОК ПРЕВЬЮ — на десктопе слева, на мобилке скрыт */}
                <div className="hidden md:block w-[10%] shrink-0 h-full overflow-auto border-r border-gray-200">
                    <ListPhoto photos={photos} activePhoto={activePhoto} changePhoto={changePhoto} />
                </div>

                {/* ЦЕНТРАЛЬНЫЙ КРОППЕР */}
                <div className="flex-1 min-h-0 md:w-[70%] flex flex-col items-center justify-between">
                    {photos.length > 0 && (
                        <div className="md:hidden w-full px-2 pt-4 border-b border-gray-200 bg-white">
                            <PhotoCarousel
                                photos={photos}
                                activePhoto={activePhoto}
                                changePhoto={changePhoto}
                            />
                        </div>
                    )}
                    {photos[activePhoto] === undefined ? (
                        <div className="relative h-full w-full flex items-center justify-center">
                            <label className="cursor-pointer">
                                <div className="w-52 h-52 bg-gray-100 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 transition">
                                    <div className="text-4xl text-gray-400">+</div>
                                    <div className="text-sm text-gray-400 mt-2">Выбрать фото</div>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAddPhotos}
                                    className="hidden"
                                    multiple
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col justify-between h-full my-2 md:my-4 px-2 md:px-0">

                            {/* Кроппер + стрелки */}
                            <div className="flex flex-row gap-2 md:gap-10 items-center justify-center w-full flex-1 min-h-0">

                                <button
                                    onClick={() => changePhoto(activePhoto - 1)}
                                    className="hidden md:flex w-16 h-16 
                                            bg-white/80 backdrop-blur-sm rounded-full 
                                            flex items-center justify-center cursor-pointer
                                            shadow-lg hover:bg-white hover:scale-110 
                                            transition-all duration-200 z-10
                                            border border-gray-200
                                            disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    disabled={activePhoto === 0}
                                >
                                    <i className="bi bi-chevron-left text-xl md:text-3xl text-gray-700"></i>
                                </button>

                                <div className=" relative w-[90vw] h-[90vw] md:w-[38vw] md:h-[38vw] 
                                                 border-0 border-gray-300">
                                    <Cropper
                                        className='border-2 border-gray-300'
                                        image={photos[activePhoto].url}
                                        ref={cropRef}

                                        crop={crop}
                                        cropSize={cropSize}
                                        zoom={zoom}
                                        rotation={rotation}

                                        minZoom={minZoom(fieldsWhite)}
                                        maxZoom={maxZoom()}

                                        onCropChange={onCropChange}
                                        onZoomChange={onZoomChange}
                                        onCropComplete={onCropComplete}
                                        onMediaLoaded={onMediaLoaded}

                                        zoomWithScroll={false}
                                        restrictPosition={fieldsWhite ? false : true}
                                        showGrid={false}
                                        style={{
                                            cropAreaStyle:
                                                cropSize.width < cropSize.height ?
                                                    withFrame ? {
                                                        boxShadow: `
                                                    ${activeSettings.right * cropSize.width / activeSettings.width}px -${activeSettings.top * cropSize.height / activeSettings.height}px 0 0 white, 
                                                    ${activeSettings.right * cropSize.width / activeSettings.width}px ${activeSettings.bottom * cropSize.height / activeSettings.height}px 0 0 white,
                                                    -${activeSettings.left * cropSize.width / activeSettings.width}px ${activeSettings.bottom * cropSize.height / activeSettings.height}px 0 white,
                                                    -${activeSettings.left * cropSize.width / activeSettings.width}px -${activeSettings.top * cropSize.height / activeSettings.height}px 0 0 white,

                                                    ${activeSettings.right * cropSize.width / activeSettings.width + 2}px -${activeSettings.top * cropSize.height / activeSettings.height + 2}px 0 0 black, 
                                                    ${activeSettings.right * cropSize.width / activeSettings.width + 2}px ${activeSettings.bottom * cropSize.height / activeSettings.height + 2}px 0 0 black,
                                                    -${activeSettings.left * cropSize.width / activeSettings.width + 2}px ${activeSettings.bottom * cropSize.height / activeSettings.height + 2}px 0 black,
                                                    -${activeSettings.left * cropSize.width / activeSettings.width + 2}px -${activeSettings.top * cropSize.height / activeSettings.height + 2}px 0 0 black,
                                                    0 0 0 200px rgba(255,255,255,0.8)`,
                                                        border: '1px dotted black'
                                                    } : {
                                                        border: '2px solid black',
                                                        color: 'rgba(255, 255, 255, 0.8)'
                                                    }
                                                    :
                                                    withFrame ? {
                                                        boxShadow: `
                                                    ${activeSettings.right * cropSize.height / activeSettings.width}px -${activeSettings.top * cropSize.width / activeSettings.height}px 0 0 white, 
                                                    ${activeSettings.right * cropSize.height / activeSettings.width}px ${activeSettings.bottom * cropSize.width / activeSettings.height}px 0 0 white,
                                                    -${activeSettings.left * cropSize.height / activeSettings.width}px ${activeSettings.bottom * cropSize.width / activeSettings.height}px 0 white,
                                                    -${activeSettings.left * cropSize.height / activeSettings.width}px -${activeSettings.top * cropSize.width / activeSettings.height}px 0 0 white,

                                                    ${activeSettings.right * cropSize.height / activeSettings.width + 2}px -${activeSettings.top * cropSize.width / activeSettings.height + 2}px 0 0 black, 
                                                    ${activeSettings.right * cropSize.height / activeSettings.width + 2}px ${activeSettings.bottom * cropSize.width / activeSettings.height + 2}px 0 0 black,
                                                    -${activeSettings.left * cropSize.height / activeSettings.width + 2}px ${activeSettings.bottom * cropSize.width / activeSettings.height + 2}px 0 black,
                                                    -${activeSettings.left * cropSize.height / activeSettings.width + 2}px -${activeSettings.top * cropSize.width / activeSettings.height + 2}px 0 0 black,
                                                    0 0 0 200px rgba(255,255,255,0.8)`,
                                                        border: '1px dotted black'
                                                    } : {
                                                        border: '2px solid black',
                                                        color: 'rgba(255, 255, 255, 0.8)'
                                                    }
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => changePhoto(activePhoto + 1)}
                                    className="hidden md:flex w-16 h-16 
                                            bg-white/80 backdrop-blur-sm rounded-full 
                                            flex items-center justify-center cursor-pointer
                                            shadow-lg hover:bg-white hover:scale-110 
                                            transition-all duration-200 z-10
                                            border border-gray-200
                                            disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    disabled={activePhoto === photos.length - 1}
                                >
                                    <i className="bi bi-chevron-right text-xl md:text-3xl text-gray-700"></i>
                                </button>
                            </div>

                            {/* МОБИЛЬНАЯ ПАНЕЛЬ: 3 кнопки + свайп-зона */}
                            <div className="md:hidden w-full flex flex-col gap-3">

                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => RotationImg(1)}
                                        className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-200
                                                flex items-center justify-center text-gray-700
                                                hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        <i className="bi bi-arrow-clockwise text-lg"></i>
                                    </button>
                                    <button
                                        onClick={() => RotationAspect()}
                                        className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-200
                                                flex items-center justify-center text-gray-700
                                                hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        <i className="bi bi-repeat text-lg"></i>
                                    </button>
                                    <button
                                        onClick={() => addField()}
                                        className={`w-8 h-8 rounded-full shadow-md border flex items-center justify-center
                                                    active:scale-95 transition-all ${fieldsWhite
                                                ? 'bg-teal-700 text-white border-teal-700'
                                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        title={fieldsWhite ? 'Убрать поля' : 'Добавить поля'}
                                    >
                                        <i className="bi bi-view-list rotate-90 text-lg"></i>
                                    </button>
                                </div>

                                {photos.length > 1 && (
                                    <div className="w-full flex items-center justify-between gap-2">

                                        <button
                                            onClick={() => changePhoto(activePhoto - 1)}
                                            disabled={activePhoto === 0}
                                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200
                                                    flex items-center justify-center shrink-0
                                                    disabled:opacity-30 disabled:cursor-not-allowed
                                                    transition-colors"
                                        >
                                            <i className="bi bi-chevron-left text-sm text-gray-700"></i>
                                        </button>

                                        <div
                                            className="flex-1 h-10 flex items-center justify-center gap-1 select-none cursor-grab active:cursor-grabbing"
                                            onTouchStart={handleTouchStart}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            {photos.map((_, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => changePhoto(i)}
                                                    className={`rounded-full transition-all duration-200 cursor-pointer ${i === activePhoto
                                                        ? 'w-6 h-1.5 bg-teal-700'
                                                        : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => changePhoto(activePhoto + 1)}
                                            disabled={activePhoto === photos.length - 1}
                                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200
                                                    flex items-center justify-center shrink-0
                                                    disabled:opacity-30 disabled:cursor-not-allowed
                                                    transition-colors"
                                        >
                                            <i className="bi bi-chevron-right text-sm text-gray-700"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Панель инструментов */}
                            <div className='hidden md:flex justify-center mt-2 md:mt-0'>
                                <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-1.5 md:p-2 flex gap-1 md:gap-2 z-10 items-center overflow-x-auto max-w-full">
                                    <button onClick={() => RotationImg(-1)} className="hidden md:flex w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </button>
                                    <button onClick={() => RotationImg(1)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                                        <i className="bi bi-arrow-clockwise"></i>
                                    </button>
                                    <div className="w-px h-6 bg-gray-300 mx-0.5 md:mx-1 shrink-0"></div>
                                    <button onClick={() => RotationAspect()} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                                        <i className="bi bi-repeat"></i>
                                    </button>
                                    <div className="w-px h-6 bg-gray-300 mx-0.5 md:mx-1 shrink-0"></div>
                                    <button
                                        onClick={() => addField()}
                                        className={`w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0 ${fieldsWhite ? 'text-blue-600' : 'text-gray-700'
                                            }`}
                                        title={fieldsWhite ? 'Убрать поля' : 'Добавить поля'}
                                    >
                                        {fieldsWhite ? <i className="bi bi-view-list rotate-90 bg-gray-200 p-2 rounded-full"></i> : <i className="bi bi-view-list rotate-90"></i>}
                                    </button>
                                    <div className="hidden md:flex w-px h-6 bg-gray-300 mx-0.5 mx-1 shrink-0"></div>
                                    <button onClick={() => cropCenter('y')} className="hidden md:flex w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                                        <i className="bi bi-arrows-collapse"></i>
                                    </button>
                                    <button onClick={() => cropCenter('x')} className="hidden md:flex w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                                        <i className="bi bi-arrows-collapse-vertical"></i>
                                    </button>
                                    <div className="hidden md:flex w-px h-6 bg-gray-300 mx-0.5 mx-1 shrink-0"></div>
                                    <div className='hidden md:flex items-center shrink-0'>
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={minZoom(fieldsWhite)}
                                            max={maxZoom()}
                                            step={0.01}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => {
                                                setZoom(parseFloat(e.target.value));
                                            }}
                                            className="w-20 md:w-auto"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* НАСТРОЙКИ СПРАВА — на десктопе, на мобилке скрыто */}
                <div className='hidden md:flex w-[20%] shrink-0 h-full flex-col justify-between bg-gray-100 border-l border-gray-200'>

                    <div className="overflow-auto p-4 flex flex-col gap-12 h-full">
                        <div className="space-y-1">
                            <input
                                type="text"
                                placeholder="номер заказа"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                        transition-all"
                                value={nameOrder} onChange={(e) => setNameOrder(e.target.value)}
                            />
                        </div>

                        <div>
                            <div>
                                <label className="text-sm font-medium text-teal-900 flex items-center gap-1 ml-1">
                                    <i className="bi bi-aspect-ratio text-teal-900"></i>
                                    Выбор размера:
                                </label>
                                <select
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm 
                                        bg-white cursor-pointer appearance-none pr-8
                                        focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-transparent 
                                        transition-all"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em'
                                    }}
                                    onChange={(e) => {
                                        changeSelect(e.target.value);
                                        e.target.blur();
                                    }}
                                >
                                    {settingsDB
                                        .filter(el => el.isShow)
                                        .map((el, index) => (
                                            <option key={index} value={el.name}>{el.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <button onClick={() => { setIsModalOpen(true); }}
                                className="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 
                                            rounded-lg text-xs font-medium text-gray-700 
                                            transition-colors flex items-center justify-center gap-2
                                            border-[1px] border-gray-200 text-teal-900">
                                <i className="bi bi-gear-fill text-teal-900"></i>
                                настройки
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 text-sm items-center mb-2">
                            <div className="flex w-full rounded-md border border-gray-300 overflow-hidden text-xs">
                                <button
                                    type="button"
                                    onClick={() => setWithFrame(false)}
                                    className={`flex-1 py-1 transition-colors ${!withFrame
                                        ? 'bg-teal-800 text-white font-light'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    только кадр
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWithFrame(true)}
                                    className={`flex-1 py-1 border-l border-gray-300 transition-colors ${withFrame
                                        ? 'bg-teal-800 text-white font-light'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    кадр с рамкой
                                </button>
                            </div>
                        </div>

                        <div className="mt-auto pt-1 ">


                        </div>

                        {photos.length > 0 &&
                            <div className="mt-auto pt-1 space-y-1.5">

                                <div className="flex justify-between items-center text-xs text-gray-400 gap-2">
                                    <span
                                        className="truncate cursor-help"
                                        title={photos[activePhoto]?.name}
                                    >
                                        Текущее: {photos[activePhoto]?.name}
                                    </span>
                                    <span className="shrink-0">{activePhoto + 1} / {photos.length}</span>
                                </div>
                                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-1 bg-teal-700 rounded-full transition-all duration-500"
                                        style={{ width: `${((activePhoto + 1) / photos.length) * 100}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Обработано </span>
                                    <span>{photos.filter(p => p.cropData).length} / {photos.length}</span>
                                </div>
                                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-1 bg-teal-700 rounded-full transition-all duration-500"
                                        style={{ width: `${(photos.filter(p => p.cropData).length / photos.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        }


                    </div>

                    <div className="p-4 border-t border-gray-200 space-y-2">
                        <div className="flex justify-between items-center gap-1 text-[10px] text-gray-400">
                            <button
                                onClick={saveCurrentPhoto}
                                disabled={!photos[activePhoto]?.cropData}
                                className="text-gray-900 hover:text-teal-700 font-xs
                                        transition-colors
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Скачать только текущее фото"
                            >
                                Скачать текущее фото
                            </button>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setOutputFormat('jpeg')}
                                    className={outputFormat === 'jpeg' ? 'text-teal-800 font-medium' : 'hover:text-gray-600'}
                                >
                                    JPEG
                                </button>
                                <span className="text-gray-300">·</span>
                                <button
                                    onClick={() => setOutputFormat('png')}
                                    className={outputFormat === 'png' ? 'text-teal-800 font-medium' : 'hover:text-gray-600'}
                                >
                                    PNG
                                </button>
                            </div>
                        </div>

                        <button
                            className="w-full px-4 py-2.5 bg-teal-700 hover:bg-teal-900 
                                        text-white rounded-lg text-sm font-medium 
                                        transition-colors flex items-center justify-center gap-2
                                        shadow-sm"
                            onClick={savePhotos}
                        >
                            <i className="bi bi-download text-white"></i>
                            Скачать все
                        </button>

                        <button
                            onClick={() => clearPhotos()}
                            className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 
                                    text-gray-700 rounded-lg text-sm font-medium 
                                    transition-colors flex items-center justify-center gap-2
                                    border border-gray-200"
                        >
                            <i className="bi bi-trash3"></i>
                            Очистить всё
                        </button>
                    </div>
                </div>

                {/* МОБИЛЬНАЯ ПАНЕЛЬ КНОПОК ВНИЗУ */}
                <div className="md:hidden shrink-0 border-t border-gray-200 bg-white py-3 px-2 flex flex-row gap-2">

                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex-1 py-1.5 bg-gray-100 rounded-lg text-sm font-light text-gray-700 flex items-center justify-center gap-2"
                    >
                        <i className="bi bi-gear-fill text-teal-900"></i>
                    </button>
                    <button
                        onClick={() => setShowPhotoList(true)}
                        className="flex-[3] py-1.5 bg-gray-100 rounded-lg text-sm font-light text-gray-700 
                                flex items-center justify-center gap-2 
                                hover:bg-gray-200 transition-colors relative"
                    >
                        <i className="bi bi-images"></i>
                        Фото
                        {photos.length > 0 && (
                            <span className="text-xs text-gray-500">{activePhoto + 1}/{photos.length}</span>
                        )}
                        <i className="bi bi-chevron-up text-md  absolute right-2 text-teal-800 "></i>
                    </button>
                    <button
                        onClick={savePhotos}
                        disabled={photos.length === 0}
                        className="flex-[3] py-1.5 bg-gray-100 rounded-lg text-sm font-light text-gray-700 
                                flex items-center justify-center gap-2
                                hover:bg-gray-200 transition-colors
                                disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Сохранить
                    </button>

                </div>

                {/* МОДАЛКА: СПИСОК ПРЕВЬЮ (только мобилка) */}
                {showPhotoList && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end"
                        onClick={() => setShowPhotoList(false)}
                    >
                        <div
                            className="w-full bg-white rounded-t-2xl max-h-[70vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center p-3 border-b">
                                <h3 className="font-semibold">Фото ({photos.length})</h3>
                                <button onClick={() => setShowPhotoList(false)} ><i className="bi bi-chevron-down text-md text-teal-800 "></i></button>
                            </div>
                            <div className="flex-1 overflow-auto p-2">
                                <ListPhoto
                                    photos={photos}
                                    activePhoto={activePhoto}
                                    changePhoto={(i) => {
                                        changePhoto(i);
                                        setShowPhotoList(false);
                                    }}
                                />
                            </div>
                            <div className="p-4 border-t">
                                <label className="cursor-pointer w-full py-2 bg-teal-700 text-white rounded-lg flex items-center justify-center gap-2">
                                    <i className="bi bi-plus-lg"></i>
                                    Добавить фото
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAddPhotos}
                                        className="hidden"
                                        multiple
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* МОДАЛКА: НАСТРОЙКИ (только мобилка) */}
                {showSettings && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end"
                        onClick={() => setShowSettings(false)}
                    >
                        <div
                            className="w-full bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="font-semibold">Настройки</h3>
                                <button onClick={() => setShowSettings(false)} className="text-gray-500 text-2xl">×</button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 space-y-4">

                                <div>
                                    <input
                                        type="text"
                                        placeholder="номер заказа"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        value={nameOrder}
                                        onChange={(e) => setNameOrder(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-teal-900 flex items-center gap-1">
                                        <i className="bi bi-aspect-ratio"></i>
                                        Размер:
                                    </label>
                                    <select
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                        onChange={(e) => changeSelect(e.target.value)}
                                    >
                                        {settingsDB.filter(el => el.isShow).map((el, index) => (
                                            <option key={index} value={el.name}>{el.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="w-full mt-2 px-4 py-2 bg-gray-100 rounded-lg text-xs font-medium text-teal-900 flex items-center justify-center gap-2 border border-gray-200"
                                    >
                                        <i className="bi bi-gear-fill"></i>
                                        настройки форматов
                                    </button>
                                </div>

                                <div className="flex w-full rounded-md border border-gray-300 overflow-hidden text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setWithFrame(false)}
                                        className={`flex-1 py-2 transition-colors ${!withFrame ? 'bg-teal-800 text-white' : 'bg-white text-gray-600'
                                            }`}
                                    >
                                        только кадр
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWithFrame(true)}
                                        className={`flex-1 py-2 border-l border-gray-300 transition-colors ${withFrame ? 'bg-teal-800 text-white' : 'bg-white text-gray-600'
                                            }`}
                                    >
                                        кадр с рамкой
                                    </button>
                                </div>

                                {photos.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span className="truncate">{photos[activePhoto]?.name}</span>
                                            <span>{activePhoto + 1} / {photos.length}</span>
                                        </div>
                                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-1 bg-teal-700 rounded-full" style={{ width: `${(photos.filter(p => p.cropData).length / photos.length) * 100}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end items-center gap-2 text-xs text-gray-400">
                                    <button
                                        onClick={() => setOutputFormat('jpeg')}
                                        className={outputFormat === 'jpeg' ? 'text-teal-800 font-medium' : ''}
                                    >
                                        JPEG
                                    </button>
                                    <span>·</span>
                                    <button
                                        onClick={() => setOutputFormat('png')}
                                        className={outputFormat === 'png' ? 'text-teal-800 font-medium' : ''}
                                    >
                                        PNG
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 border-t space-y-2">
                                <button
                                    onClick={saveCurrentPhoto}
                                    disabled={!photos[activePhoto]?.cropData}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5
                                            bg-white hover:bg-teal-50
                                            text-teal-900 border border-teal-900
                                            rounded-lg text-sm font-medium
                                            transition-colors
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Скачать только текущее фото"
                                >
                                    <i className="bi bi-download"></i>
                                    Скачать это фото
                                </button>
                                <button
                                    className="w-full px-4 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                    onClick={() => {
                                        savePhotos();
                                        setShowSettings(false);
                                    }}
                                >
                                    <i className="bi bi-download"></i>
                                    Скачать все
                                </button>
                                <button
                                    onClick={() => {
                                        clearPhotos();
                                        setShowSettings(false);
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-gray-200"
                                >
                                    <i className="bi bi-trash3"></i>
                                    Очистить всё
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[80%] h-[80vh] flex flex-col px-4 pb-4 pt-1" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className='text-green-900'></DialogTitle>
                        <DialogDescription className="sr-only">
                        </DialogDescription>
                    </DialogHeader>

                    <ModalSettings settingsDB={settingsDB} setSettingsDB={setSettingsDB} setIsModalOpen={setIsModalOpen} />

                </DialogContent>
            </Dialog>

        </>

    );
};

export default CropperMain;