import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import _ from 'lodash'
import { $host } from '../../http';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import ModalSettings from './ModalSettings';
import ListPhoto from './ListPhoto';

const CropperMain = ({ photos, setPhotos, onSaveCrop, handleAddPhotos, setActivePhoto, activePhoto, savePhotos, nameOrder, setNameOrder, setNameFormat}) => {
    
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [zoomDef, setZoomDef] = useState(1) 
    const [cropSize, setCropSize] = useState({width: 400, height: 400})
    const [rotation, setRotation] = useState(0)
    const [fieldsWhite, setFieldsWhite] = useState(false)
    const [media, setMedia] = useState()
    const [pixels, setPixels] = useState()
    
    const [settingsDB, setSettingsDB] = useState([]) 
    const [activeSettings, setActiveSettings] = useState()
    const [withFrame, setWithFrame] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false);
    const cropRef = useRef()
    

    //загрузка настроек из бд
    useEffect(()=>{
        async function getSettingEditor() {
          const { data } = await $host.get('api/settings/getSettingEditor');

            if(data.length<1){
                const data1 = {
                    name: '10x15',
                    width: 10,
                    height: 15,
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right:0
                }
                await $host.put('api/settings/changeSettingEditor', data1);
            }

            const dataSort = _.sortBy(data, 'name', 'asc')
            setSettingsDB(dataSort)
            setActiveSettings(dataSort[0])
            setNameFormat(dataSort[0].name)
        }
        getSettingEditor();
    },[])

    useEffect(() => {
        //console.log('effect')
        if (!photos[activePhoto]?.cropData) return;
        
        const data = photos[activePhoto].cropData;
        setCropSize(data.cropSize);
        setCrop(data.crop);
        setZoom(data.zoom);
        setZoomDef(data.zoomDef);
        setRotation(data.rotation);
        setFieldsWhite(data.fieldsWhite);
        setMedia(data.media);
    }, [activePhoto]); 

    //при открытии фото адаптируем положение кропа(каждый раз срабатывает)
    const onMediaLoaded = (mediaSize) => {
        setMedia(mediaSize)

        if (photos[activePhoto]?.cropData?.cropSize !== undefined ){
        //перенес логику в useEffect
            
        }else{
        // дальше проходит только при первом открытии
            const indexDown = 0.8
            const k = Math.max(activeSettings.top, activeSettings.bottom)
            const kef = activeSettings.height/(Number(activeSettings.height)+2*k)
            const sizeFrame = cropRef.current.containerRect.height * kef *indexDown

            let x, y
            if(mediaSize.width>mediaSize.height){
                x = sizeFrame
                y = sizeFrame*activeSettings.width/activeSettings.height
            }else{
                x = sizeFrame*activeSettings.width/activeSettings.height
                y = sizeFrame
            }

            const valueZoom = Math.max(
                x / mediaSize.width,
                y / mediaSize.height,
            );
            
            const newCropData = {width: x, height: y}

            setCropSize(newCropData);
            setTimeout(()=>{
                setCrop({ x: 0, y: 0 })
                setZoom(valueZoom);
                setZoomDef(valueZoom)
                setMedia(mediaSize)
                setFieldsWhite(false)

                onSaveCrop(photos[activePhoto].id, {
                    zoom: valueZoom,
                    zoomDef: valueZoom,
                    cropSize: newCropData,
                    crop: { x: 0, y: 0 },
                    media: mediaSize,
                    rotation: 0,
                    fieldsWhite: false
                });
            },150) 
        }

        
        
    };

    // Сохраняем при каждом изменении
    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        //console.log('onCropComplete')
        //console.log(croppedAreaPixels)
        setPixels(croppedAreaPixels)
        onSaveCrop(photos[activePhoto].id, { crop, cropSize, zoom, rotation, fieldsWhite, pixels: croppedAreaPixels});

    };
    
    const onCropChange = (newCrop) => {
        //console.log('onCropChange')
        setCrop(newCrop);
        onSaveCrop(photos[activePhoto].id, { 
            crop: newCrop
        });
    };

    const onZoomChange = (newZoom) => {
        console.log('onZoomChange')
        setZoom(newZoom);
        onSaveCrop(photos[activePhoto].id, { 
            zoom: newZoom
        });
    };

    //выбор другого формата в селекте 
    const changeSelect = (value) => {  
        const selectedSettings = settingsDB.find(el => el.name === value);
        if(selectedSettings) {
            
            setActiveSettings(selectedSettings);
            setNameFormat(selectedSettings.name)

            setPhotos(prev => prev.map(el => ({
                ...el,
                cropData: null
            })));

            if(photos.length===1){
                clearPhotos()
                return;
            }

            if(activePhoto !== 0) setActivePhoto(0);
            else {
                setActivePhoto(1);
                setTimeout(()=>{
                    setActivePhoto(0);
                },10)
            }

        }
    };

    //добавление белых полей
    const addField = () =>{

        if(!fieldsWhite){
            const value = Math.min(
                cropSize.width / media.width,
                cropSize.height / media.height,
            );
            
            setTimeout(()=>{setCrop({ x: 0, y: 0 });},5)
            setZoom(value);

            onSaveCrop(photos[activePhoto].id, { crop:{ x: 0, y: 0 }, zoom: value, fieldsWhite: true});
           
        }else{
            const value = Math.max(
                cropSize.width / media.width,
                cropSize.height / media.height,
            );
            setZoom(value);
            setCrop({ x: 0, y: 0 })
            onSaveCrop(photos[activePhoto].id, { crop:{ x: 0, y: 0 }, zoom: value, fieldsWhite: false});
        }

        setFieldsWhite(!fieldsWhite)
       
    }

    const minZoom = () =>{
        if(fieldsWhite===true){
            const value = Math.min(
                cropSize.height/media.height,
                cropSize.width/media.width,
            );
            return value
        }
        if(fieldsWhite===false){
            
            return zoomDef
        } 
    }

    const maxZoom = () =>{
        if(fieldsWhite) return zoomDef
        else return 3*zoomDef
    }

    const RotationImg = (value) =>{
        setRotation(rotation + 90*value)
    }

    const RotationAspect = () =>{
        const x = cropSize.width
        const y = cropSize.height

        const newCropSize = {width: y, height: x}

        setCropSize(newCropSize)
        onSaveCrop(photos[activePhoto].id, {cropSize: newCropSize})
    }

    const cropCenter = (value) => {
        const position = { ...crop };
        
        if (value === 'x') {
            position.x = 0;
        } else if (value === 'y') {
            position.y = 0;
        }
        
        setCrop(position);
        onSaveCrop(photos[activePhoto].id, { crop: position });
    }

    const clearPhotos = () =>{
        setPhotos([])
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setZoomDef(1)
        setCropSize({width: 400, height: 400})
        setRotation(0)
        setFieldsWhite(false)
        setNameOrder('')
    }

    const changePhoto = (index) => {
        // 1. Мгновенно сохраняем текущее фото (без задержки)
        const currentData = {
            cropSize,
            crop,
            zoom,
            zoomDef,
            rotation,
            fieldsWhite,
            media,
            pixels
        };
        
        setPhotos(prev => prev.map((photo, idx) => 
            idx === activePhoto ? { ...photo, cropData: currentData } : photo
        ));
        
        // 2. Переключаем фото
        
        if (index >= 0 && index < photos.length) {
            setActivePhoto(index);
            
        // 3. Загружаем настройки нового фото
        const newPhoto = photos[index];
        if (newPhoto?.cropData) {
        const data = newPhoto.cropData;
        setCropSize(data.cropSize);
        setCrop(data.crop);
        setZoom(data.zoom);
        setZoomDef(data.zoomDef);
        setRotation(data.rotation);
        setFieldsWhite(data.fieldsWhite);
        setMedia(data.media);
        }
        }
    };


    return (
        <>
        <div className="h-full bg-white flex flex-row">

            {/* список миниатюр */}
            <div>
                <ListPhoto photos={photos} activePhoto={activePhoto} changePhoto={changePhoto} />
            </div>
        
            {/* основной кроппер и кнопки редактирования */}
            <div className="flex-[7] flex flex-col items-center justify-start ">
                    
                {photos[activePhoto] === undefined ? 

                    /* когда не выбрано фото */      
                    <div className="relative h-full ">
                        <div className='flex items-center justify-center h-full'>
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
                    </div>
                 : 
                    /* основной блок с кроппером */  
                    <div className='w-[100%] flex flex-col justify-between h-full  my-4'>
                        {/* имя файла*/}
                        <div className='flex flex-row gap-20 justify-center text-sm items-center'>
                            <label className='text-md'>Формат: {activeSettings.name}</label>
                            <label className="block truncate max-w-[40%] cursor-help" title={photos[activePhoto]?.name} >
                                Имя файла: {photos[activePhoto]?.name}
                            </label>
                        </div>

                        {/* кроппер */}
                        <div className='flex flex-row gap-10 items-center justify-center w-[100%] h-[38vw]'>
                            <button 
                                onClick={() => changePhoto(activePhoto-1)}
                                className=" left-8 top-1/2 -translate-y-1/2 w-16 h-16 
                                            bg-white/80 backdrop-blur-sm rounded-full 
                                            flex items-center justify-center cursor-pointer
                                            shadow-lg hover:bg-white hover:scale-110 
                                            transition-all duration-200 z-10
                                            border border-gray-200
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={activePhoto === 0}
                                >
                                <i className="bi bi-chevron-left text-3xl text-gray-700"></i>
                            </button>
                            <div className="relative w-[38vw] h-[38vw] border-[0px] border-gray-300">
                                <Cropper

                                    className='border-2 border-gray-300'
                                    image={photos[activePhoto].url}
                                    ref={cropRef}

                                    crop={crop}
                                    cropSize={cropSize}
                                    zoom={zoom}
                                    rotation={rotation}
                                    
                                    onCropChange={onCropChange}
                                    onZoomChange={onZoomChange}
                                    onCropComplete={onCropComplete}
                                    onMediaLoaded={onMediaLoaded}

                                    zoomWithScroll={false}
                                    restrictPosition={fieldsWhite ? false : true}
                                    showGrid={false}
                                    //objectFit="horizontal-cover"
                                    style={{
                                        cropAreaStyle: 
                                            cropSize.width<cropSize.height ?
                                            withFrame ? {
                                                boxShadow: `
                                                ${activeSettings.right*cropSize.width/activeSettings.width}px -${activeSettings.top*cropSize.height/activeSettings.height}px 0 0 white, 
                                                ${activeSettings.right*cropSize.width/activeSettings.width}px ${activeSettings.bottom*cropSize.height/activeSettings.height}px 0 0 white,
                                                -${activeSettings.left*cropSize.width/activeSettings.width}px ${activeSettings.bottom*cropSize.height/activeSettings.height}px 0 white,
                                                -${activeSettings.left*cropSize.width/activeSettings.width}px -${activeSettings.top*cropSize.height/activeSettings.height}px 0 0 white,

                                                ${activeSettings.right*cropSize.width/activeSettings.width+2}px -${activeSettings.top*cropSize.height/activeSettings.height+2}px 0 0 black, 
                                                ${activeSettings.right*cropSize.width/activeSettings.width+2}px ${activeSettings.bottom*cropSize.height/activeSettings.height+2}px 0 0 black,
                                                -${activeSettings.left*cropSize.width/activeSettings.width+2}px ${activeSettings.bottom*cropSize.height/activeSettings.height+2}px 0 black,
                                                -${activeSettings.left*cropSize.width/activeSettings.width+2}px -${activeSettings.top*cropSize.height/activeSettings.height+2}px 0 0 black,
                                                0 0 0 200px rgba(255,255,255,0.8)`,
                                                border: '1px dotted black'
                                                } : {
                                                    border: '2px solid black',
                                                    color: 'rgba(255, 255, 255, 0.8)'
                                                }
                                            :
                                            withFrame ? {
                                                boxShadow: `
                                                ${activeSettings.right*cropSize.height/activeSettings.width}px -${activeSettings.top*cropSize.width/activeSettings.height}px 0 0 white, 
                                                ${activeSettings.right*cropSize.height/activeSettings.width}px ${activeSettings.bottom*cropSize.width/activeSettings.height}px 0 0 white,
                                                -${activeSettings.left*cropSize.height/activeSettings.width}px ${activeSettings.bottom*cropSize.width/activeSettings.height}px 0 white,
                                                -${activeSettings.left*cropSize.height/activeSettings.width}px -${activeSettings.top*cropSize.width/activeSettings.height}px 0 0 white,

                                                ${activeSettings.right*cropSize.height/activeSettings.width+2}px -${activeSettings.top*cropSize.width/activeSettings.height+2}px 0 0 black, 
                                                ${activeSettings.right*cropSize.height/activeSettings.width+2}px ${activeSettings.bottom*cropSize.width/activeSettings.height+2}px 0 0 black,
                                                -${activeSettings.left*cropSize.height/activeSettings.width+2}px ${activeSettings.bottom*cropSize.width/activeSettings.height+2}px 0 black,
                                                -${activeSettings.left*cropSize.height/activeSettings.width+2}px -${activeSettings.top*cropSize.width/activeSettings.height+2}px 0 0 black,
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
                            onClick={() => changePhoto(activePhoto+1)}
                            className=" right-8 top-1/2 -translate-y-1/2 w-16 h-16 
                                        bg-white/80 backdrop-blur-sm rounded-full 
                                        flex items-center justify-center cursor-pointer
                                        shadow-lg hover:bg-white hover:scale-110 
                                        transition-all duration-200 z-10
                                        border border-gray-200
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={activePhoto === photos.length - 1}
                            >
                            <i className="bi bi-chevron-right text-3xl text-gray-700"></i>
                            </button>
                        </div>

                        {/* кнопки редактирования */}
                        <div className='flex justify-center'>
                            <div className=" bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-2 flex gap-2 z-10  items-center">
                                    <button  onClick={() => RotationImg(-1)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700">
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </button>
                                    <button  onClick={() => RotationImg(1)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700">
                                        <i className="bi bi-arrow-clockwise"></i>
                                    </button>
                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                    <button  onClick={() => RotationAspect()} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700">
                                        <i className="bi bi-repeat"></i>
                                    </button>
                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                    <button 
                                        onClick={() => addField()} 
                                        className={`w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors ${
                                            fieldsWhite ? 'text-blue-600' : 'text-gray-700'
                                        }`}
                                        title={fieldsWhite ? 'Убрать поля' : 'Добавить поля'}
                                        >
                                        {fieldsWhite ? <i className="bi bi-view-list rotate-90  bg-gray-200 p-2 rounded-full"></i> : <i className="bi bi-view-list rotate-90"></i>}
                                    </button>
                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                    <button  onClick={() => cropCenter('y')} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700">
                                        <i className="bi bi-arrows-collapse"></i>
                                    </button>
                                    <button  onClick={() => cropCenter('x')} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700">
                                        <i className="bi bi-arrows-collapse-vertical"></i>
                                    </button>
                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                    <div className='flex items-center'>
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={minZoom()}
                                            max={maxZoom()}
                                            step={0.01}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => {
                                                setZoom(e.target.value)
                                            }}
                                            
                                        />
                                    </div>
                                </div>
                        </div>
                        
                    </div>
                }
            </div>

            {/* меню справа */}
            <div className='flex-[2] flex flex-col justify-between bg-gray-100 border-l border-gray-200'>
               
                <div className="overflow-auto p-4 flex flex-col">
                    {/* Номер заказа */}
                    <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <i className="bi bi-hash text-gray-400"></i>
                        Номер заказа
                    </label>
                    <input 
                        type="text" 
                        placeholder="Введите номер заказа"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                transition-all"
                        value={nameOrder} onChange={(e)=>setNameOrder(e.target.value)}
                    />
                    </div>
                    
                    {/* Размер */}
                    <div className="mt-12">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <i className="bi bi-aspect-ratio text-gray-400"></i>
                            Размер
                        </label>
                        <select 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm "
                            onChange={(e) => changeSelect(e.target.value)}
                        >
                            {settingsDB.map((el, index) => (
                            <option key={index} value={el.name}>{el.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex flex-col gap-2 text-sm items-center my-4">
                        <label className='text-left w-full'><i className="bi bi-back"></i> Отображать:</label>
                        <select 
                            value={withFrame ? 'true' : 'false'} 
                            onChange={(e) => setWithFrame(e.target.value === 'true')} 
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm '
                        >
                            <option value="false">только кадр</option>
                            <option value="true">кадр с рамкой</option>
                        </select>
                    </div>

                    {/* Настройки */}
                    <button onClick={()=>{setIsModalOpen(true)}}
                                    className="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 
                                    rounded-lg text-xs font-medium text-gray-700 
                                    transition-colors flex items-center justify-center gap-2
                                    border border-gray-200">
                        <i className="bi bi-gear-fill"></i>
                         настройки
                    </button>
                </div>
                
                {/* Кнопки внизу */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                    <button 
                        className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 
                                    text-white rounded-lg text-sm font-medium 
                                    transition-colors flex items-center justify-center gap-2
                                    shadow-sm"
                        onClick={savePhotos}
                        >
                        <i className="bi bi-download"></i>
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
                
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-[80%] max-h-[80vh] flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                <DialogTitle className='text-green-900'>Настройки форматов для печати</DialogTitle>
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