import React, { useEffect, useRef, useState } from "react";
import CropperMain from "./CropperMain"
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


const Redactor = () => {

    const [photos, setPhotos] = useState([]);
    const [activePhoto, setActivePhoto] = useState(0);

    const [loadingCount, setLoadingCount] =  useState(0)
    const [isDownloading, setIsDownloading] = useState(false);
    const [nameOrder, setNameOrder] = useState('')
    const [nameFormat, setNameFormat] = useState('')
    
    //загрузка фото
    const handleAddPhotos = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.map((file, i) => ({
            id: Date.now() + i,
            url: URL.createObjectURL(file),
            name: file.name,
            cropData: null
        })); 
        setPhotos(newPhotos);
        setActivePhoto(0);
    };

    //сохранение изменений кропа
    const onSaveCrop = (photoId, newData) => {
        setPhotos(prev => prev.map(photo => 
            photo.id === photoId 
            ? { 
                ...photo, 
                cropData: { 
                    ...photo.cropData,  // старые данные
                    ...newData          // новые (crop, zoom)
                } 
                } 
            : photo
        ));
    };


    const savePhotos = async () => {

        for (let i = 0; i < photos.length; i++){
            if(!photos[i].cropData) 
                {
                    window.alert('не все фото обработаны')
                    return

                }
        }

        setIsDownloading(true);
        const zip = new JSZip();
        //console.log(photos)
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            setLoadingCount(prev=>prev+1)
            const img = new Image();
            img.src = photo.url;
            await new Promise((resolve) => { img.onload = resolve; });
            
            const { pixels, rotation } = photo.cropData;
            
            //для поворота изображения
            let sourceCanvas = document.createElement('canvas');
            let sourceCtx = sourceCanvas.getContext('2d');
            
            // Поворот изображения
            if (rotation) {
            if (rotation % 180 === 0) {
                sourceCanvas.width = img.width;
                sourceCanvas.height = img.height;
            } else {
                sourceCanvas.width = img.height;
                sourceCanvas.height = img.width;
            }
            
            sourceCtx.translate(sourceCanvas.width / 2, sourceCanvas.height / 2);
            sourceCtx.rotate((rotation * Math.PI) / 180);
            sourceCtx.drawImage(img, -img.width / 2, -img.height / 2);
            } else {
            sourceCanvas.width = img.width;
            sourceCanvas.height = img.height;
            sourceCtx.drawImage(img, 0, 0);
            }
            
            //основной канвас
            const canvas = document.createElement('canvas');
            //console.log(pixels)
            canvas.width = pixels.width;
            canvas.height = pixels.height;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const addX = Math.max(0, -pixels.x);
            const addY = Math.max(0, -pixels.y);
            
            ctx.drawImage(
                sourceCanvas,
                pixels.x, pixels.y,
                pixels.width, pixels.height,
                addX, addY,
                canvas.width, canvas.height
            );
            
            // Получаем blob и добавляем в zip
            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/png');
            });
            
            const fileName = `${photo.name.split('.')[0]}.png`;
            zip.file(fileName, blob);
            }
        
        // Генерируем и скачиваем архив
        zip.generateAsync({ type: "blob" }).then((content) => {
        saveAs(content, `${nameOrder}_${nameFormat}.zip`);
        setTimeout(() => {
            setIsDownloading(false);
            setLoadingCount(0)
            window.alert("Все фото обработаны и скачены");
        }, 500);
        });

    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">

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
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex-shrink-0 border-t p-4 bg-gray-700">
                <div className="flex flex-row justify-between items-center gap-10">
                    <div className="flex-[3] flex flex-col">
                        <div className="text-sm text-gray-100 mb-1">
                        {isDownloading 
                            ? `Скачивание: ${loadingCount} / ${photos.length} фото`
                            : `В обработке: ${photos.length ? activePhoto + 1 : 0} / ${photos.length} фото`
                        }
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all ${
                            ((activePhoto + 1) / photos.length) === 1 
                                ? 'bg-green-500' 
                                : 'bg-yellow-500'
                            }`}
                            style={{ 
                            width: isDownloading 
                                ? `${(loadingCount / photos.length) * 100}%`
                                : `${((activePhoto + 1) / photos.length) * 100}%`
                            }}
                        />
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>

    )
}

export default Redactor