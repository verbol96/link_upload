import React, { useState, useRef, useEffect} from 'react';
import EditOne from './EditOne';
import './styleEditor.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { $host } from '../../http';
import imageCompression from 'browser-image-compression';

const EditMain = () => {
    const [images, setImages] = useState([]);
    const [imagesOriginal, setImagesOriginal] = useState([]);

    const [aspectRatio, setAspectRatio] = useState(2/3)
    const [settings, setSettings] = useState(false)
    const cropperRefs = useRef([]);
    const [progress, setProgress] = useState(false);

    const [settingsDB, setSettingsDB] = useState([]) 
    const [name, setName] = useState('10x15')
    const [width, setWidth] = useState(10)
    const [height, setHeight] = useState(15)
    const [top, setTop] = useState(0)
    const [left, setLeft] = useState(0)
    const [right, setRight] = useState(0)
    const [bottom, setBottom] = useState(0)

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

            setSettingsDB(data)
            setName(data[0].name)
            setWidth(Number(data[0].width))
            setHeight(Number(data[0].height))
            setTop(Number(data[0].top))
            setBottom(Number(data[0].bottom))
            setLeft(Number(data[0].left))
            setRight(Number(data[0].right))
            setAspectRatio(data[0].width/data[0].height)
        }
        getSettingEditor();
      },[])

    const handleImageUpload = async(event) => {
        const files = Array.from(event.target.files);
        setImagesOriginal(files);

        const options = {
            maxWidthOrHeight: 500
          }

        try {
            const compressionPromises = files.map((file) => imageCompression(file, options));
            const compressedFiles = await Promise.all(compressionPromises);
            setImages(compressedFiles); 
          } catch (error) {
            console.log(error);
          }
    }; 

    const getCropperRef = (index) => {
        if (!cropperRefs.current[index]) {
            cropperRefs.current[index] = React.createRef();
        }
        return cropperRefs.current[index];
    }

    const saveOne = async() =>{
        setProgress(true)
        
            const zip = new JSZip();
            const imageFolder = zip.folder(name);
            
            
            for (let i = 0; i < cropperRefs.current.length; i++) {
                const cropperRef = cropperRefs.current[i];
                if (cropperRef && cropperRef.current) {
                    const cropper = cropperRef.current;

                    const imageOrig1 = new Image();
                    imageOrig1.src = URL.createObjectURL(imagesOriginal[i]);

                    await new Promise((resolve) => {
                        imageOrig1.onload = resolve;
                      });

                    const canvas1 = document.createElement('canvas');
                    const context1 = canvas1.getContext('2d');
                    if(cropper.props.rotation%180===0){
                        canvas1.width = imageOrig1.naturalWidth
                        canvas1.height = imageOrig1.naturalHeight
                    }else{
                        canvas1.width = imageOrig1.naturalHeight
                        canvas1.height = imageOrig1.naturalWidth
                    }
                    
                    context1.save();
                    context1.translate(canvas1.width / 2, canvas1.height / 2);
                    context1.rotate(cropper.props.rotation * Math.PI / 180);  // Поворот на 90 градусов
                    context1.drawImage(imageOrig1, -imageOrig1.width / 2, -imageOrig1.height / 2);
                    context1.restore();

                    const croppedCanvas = cropper.getCropData();
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    const k=imageOrig1.naturalWidth/cropper.mediaSize.naturalWidth

                    let addX=0 // добавленения если у кропа есть белые поля
                    let addY=0 // добавленения если у кропа есть белые поля

                    let { x, y} = croppedCanvas.croppedAreaPixels; 
                    x=x*k
                    y=y*k
                    const widthCrop =croppedCanvas.croppedAreaPixels.width
                    const heightCrop =croppedCanvas.croppedAreaPixels.height

                    if(x<0) addX=Math.abs(x)
                    if(y<0) addY=Math.abs(y)

                    const leftN = widthCrop*left/width*k
                    const rightN = widthCrop*right/width*k
                    const topN = heightCrop*top/height*k
                    const bottomN = heightCrop*bottom/height*k
                    canvas.width = (widthCrop*k+leftN+rightN);
                    canvas.height = (heightCrop*k+topN+bottomN);             

                    context.fillStyle = 'white';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    
                    context.drawImage(canvas1, x, y, widthCrop*k, heightCrop*k, addX+leftN, addY+topN, widthCrop*k, heightCrop*k);
                    const imageDataUrl = canvas.toDataURL('image/png');
        
                    croppedCanvas.width = 0;
                    croppedCanvas.height = 0;
                    canvas.width = 0;
                    canvas.height = 0;
        
                    let imageData = atob(imageDataUrl.substring(22));
                    let arraybuffer = new ArrayBuffer(imageData.length);
                    let view = new Uint8Array(arraybuffer);

                    for (let j = 0; j < imageData.length; j++) {
                        view[j] = imageData.charCodeAt(j) & 0xff;
                    }

                    let blob = new Blob([view], {type: 'image/png'});
                    const name = images[i].name.split('.')[0]
                    imageFolder.file(`${name}.png`, blob);
                    URL.revokeObjectURL(blob);

                    imageData = null;
                    view = null;
                    arraybuffer = null;
                    blob = null;
                
                    
                    
                } else {
                    console.warn(`Image ${i} could not be processed.`);
                }
            }

        
            zip.generateAsync({type:"blob"}).then((content) => {
                saveAs(content, `${name}.zip`);
            });
        

        setTimeout(()=>{setProgress(false)},1500)
    }

    const saveDouble =async() =>{
        setProgress(true)
        const zip = new JSZip();
        const imageFolder = zip.folder(name);
        
        
        for (let i = 0; i < cropperRefs.current.length; i+=2) {
            const cropperRef = cropperRefs.current[i];
            const cropperRef1 = cropperRefs.current[i+1];

            
            if (cropperRef && cropperRef.current) {
                const cropper = cropperRef.current;
                const croppedCanvas = cropper.getCropData();

                const imageOrig1 = new Image();
                imageOrig1.src = URL.createObjectURL(imagesOriginal[i]);

                await new Promise((resolve) => {
                    imageOrig1.onload = resolve;
                  });

                const canvas1 = document.createElement('canvas');
                const context1 = canvas1.getContext('2d');
                if(cropper.props.rotation%180===0){
                    canvas1.width = imageOrig1.naturalWidth
                    canvas1.height = imageOrig1.naturalHeight
                }else{
                    canvas1.width = imageOrig1.naturalHeight
                    canvas1.height = imageOrig1.naturalWidth
                }
                
                context1.save();
                context1.translate(canvas1.width / 2, canvas1.height / 2);
                context1.rotate(cropper.props.rotation * Math.PI / 180);  // Поворот на 90 градусов
                context1.drawImage(imageOrig1, -imageOrig1.width / 2, -imageOrig1.height / 2);
                context1.restore();

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                const k=imageOrig1.naturalWidth/cropper.mediaSize.naturalWidth

                let addX=0 // добавленения если у кропа есть белые поля
                let addY=0 // добавленения если у кропа есть белые поля

                let { x, y} = croppedCanvas.croppedAreaPixels; 
                x=x*k
                y=y*k
                const widthCrop =croppedCanvas.croppedAreaPixels.width
                const heightCrop =croppedCanvas.croppedAreaPixels.height

                if(x<0) addX=Math.abs(x)
                if(y<0) addY=Math.abs(y)

                const leftN = widthCrop*left/width*k
                const rightN = widthCrop*right/width*k
                const topN = heightCrop*top/height*k
                const bottomN = heightCrop*bottom/height*k
                canvas.width = (widthCrop*k+leftN+rightN)*2;
                canvas.height = (heightCrop*k+topN+bottomN);    

                context.fillStyle = 'white';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(canvas1, x, y, widthCrop*k, heightCrop*k, addX+leftN, addY+topN, widthCrop*k, heightCrop*k);

                //первый штрих
                context.beginPath();
                context.moveTo(canvas.width/2, 0);
                context.lineTo(canvas.width/2, canvas.height/100);
                context.lineWidth = canvas.width/1000;
                context.strokeStyle = '#dfdfdf'; 
                context.stroke();

                //второй штрих
                context.beginPath();
                context.moveTo(canvas.width/2, canvas.height-canvas.height/100);
                context.lineTo(canvas.width/2, canvas.height);
                context.lineWidth = canvas.width/1000;
                context.strokeStyle = '#dfdfdf'; 
                context.stroke();

                if(cropperRef1){
                    const cropper1 = cropperRef1.current;
                    const croppedCanvas1 = cropper1.getCropData();

                    const imageOrig1 = new Image();
                    imageOrig1.src = URL.createObjectURL(imagesOriginal[i+1]);

                    await new Promise((resolve) => {
                        imageOrig1.onload = resolve;
                    });

                    const canvas1 = document.createElement('canvas');
                    const context1 = canvas1.getContext('2d');
                    if(cropper1.props.rotation%180===0){
                        canvas1.width = imageOrig1.naturalWidth
                        canvas1.height = imageOrig1.naturalHeight
                    }else{
                        canvas1.width = imageOrig1.naturalHeight
                        canvas1.height = imageOrig1.naturalWidth
                    }
                    
                    context1.save();
                    context1.translate(canvas1.width / 2, canvas1.height / 2);
                    context1.rotate(cropper1.props.rotation * Math.PI / 180);  // Поворот на 90 градусов
                    context1.drawImage(imageOrig1, -imageOrig1.width / 2, -imageOrig1.height / 2);
                    context1.restore(); 


                    let addX1=0 // добавленения если у кропа есть белые поля
                    let addY1=0 // добавленения если у кропа есть белые поля

                    const k1=imageOrig1.naturalWidth/cropper1.mediaSize.naturalWidth
    
                    let x1 = croppedCanvas1.croppedAreaPixels.x; 
                    let y1 = croppedCanvas1.croppedAreaPixels.y; 
                    const widthCrop1 =croppedCanvas1.croppedAreaPixels.width
                    const heightCrop1 =croppedCanvas1.croppedAreaPixels.height
    
                    if(x1<0) addX1=Math.abs(x1)
                    if(y1<0) addY1=Math.abs(y1)

                    context.drawImage(canvas1, x1*k1, y1*k1, widthCrop1*k1, heightCrop1*k1, (canvas.width/2)+(addX1*widthCrop/widthCrop1*k)+leftN, addY1*widthCrop/widthCrop1*k+topN, widthCrop*k, heightCrop*k);
                }
                
                const imageDataUrl = canvas.toDataURL('image/png');
    
                croppedCanvas.width = 0;
                croppedCanvas.height = 0;
                canvas.width = 0;
                canvas.height = 0;
    
                let imageData = atob(imageDataUrl.substring(22));
                let arraybuffer = new ArrayBuffer(imageData.length);
                let view = new Uint8Array(arraybuffer);

                for (let j = 0; j < imageData.length; j++) {
                    view[j] = imageData.charCodeAt(j) & 0xff;
                }

                let blob = new Blob([view], {type: 'image/png'});
                const name = images[i].name.split('.')[0]
                imageFolder.file(`${name}.png`, blob);
                URL.revokeObjectURL(blob);

                imageData = null;
                view = null;
                arraybuffer = null;
                blob = null;
               
            } else {
                console.warn(`Image ${i} could not be processed.`);
            }
        }
    
        zip.generateAsync({type:"blob"}).then((content) => {
            saveAs(content, `${name}.zip`);
        });

        setTimeout(()=>{setProgress(false)},1500)
    }


    const save = async () => {
        if((Number(width)+Number(left)+Number(right))<=7.6 && (Number(height)+Number(top)+Number(bottom))<=10.2) saveDouble()
        else saveOne()
        

    }

    const saveSetting = async() =>{
        const userConfirmation = window.confirm("Вы уверены, что хотите изменить?");
    
        if (userConfirmation) {
          const data1 = {
            name,
            width,
            height,
            top,
            bottom,
            left,
            right
          }
          await $host.put('api/settings/changeSettingEditor', data1);
          const { data } = await $host.get('api/settings/getSettingEditor');
            setSettingsDB(data)
            setName(data[0].name)
            setWidth(data[0].width)
            setHeight(data[0].height)
            setTop(data[0].top)
            setBottom(data[0].bottom)
            setLeft(data[0].left)
            setRight(data[0].right)
            setAspectRatio(data[0].width/data[0].height)
        }
    }

    const deleteSetting = async() =>{
        const userConfirmation = window.confirm("Вы уверены, что хотите удалить?");
    
        if (userConfirmation) {
            await $host.delete(`api/settings/deleteSettingEditor/${name}`);
            const { data } = await $host.get('api/settings/getSettingEditor');
                setSettingsDB(data)
                setName(data[0].name)
                setWidth(data[0].width)
                setHeight(data[0].height)
                setTop(data[0].top)
                setBottom(data[0].bottom)
                setLeft(data[0].left)
                setRight(data[0].right)
                setAspectRatio(data[0].width/data[0].height)
        }
    }

    const changeSelect = (value) => {
        const selectedSettings = settingsDB.find(el => el.name === value);
        if(selectedSettings) {
            setName(selectedSettings.name);
            setWidth(selectedSettings.width);
            setHeight(selectedSettings.height);
            setTop(selectedSettings.top);
            setBottom(selectedSettings.bottom);
            setLeft(selectedSettings.left);
            setRight(selectedSettings.right);
            setAspectRatio(selectedSettings.width/selectedSettings.height)
        }
    }

    const clearFrame = () =>{
        const userConfirmation = window.confirm("Вы уверены, что хотите очистить?");
    
        if (userConfirmation) {
        setImages([])
        }
    }

    return (
        <div>
            <div className='menu-editor'>
                <label className="file-input">
                    Выбрать фото
                    <input type="file" multiple accept="image/*" style={{display:'none'}}  onChange={handleImageUpload} className="file-input-field" />
                    
                </label>
                <div className='select-menu-out'>
                    <select className='select-menu-in' value={name} onChange={(e)=>changeSelect(e.target.value)}>
                            {settingsDB.map((el,index)=> <option key={index} value={el.name}>{el.name}</option>)}
                           
                    </select>
                </div>
                
                <div className='settings-container'>
                    <button 
                        className='button-menu' 
                        style={{background: settings?'darkgray':'white'}}
                        onClick={()=>setSettings(!settings)}
                    >
                        <i style={{color:'black'}} className="bi bi-gear"></i>
                    </button>
                    {settings && 
                        <div className='settings-editor'>
                            <span className='settings-editor-row'>
                                <label>имя: </label>
                                <input value={name} onChange={(e)=>setName(e.target.value)} />
                            </span>
                            <div></div>
                            <span className='settings-editor-row'>
                                <label>высота: </label>
                                <input  value={height} onChange={(e)=>setHeight(e.target.value)}  />
                            </span>
                            <span className='settings-editor-row'>
                                <label>ширина: </label>
                                <input  value={width} onChange={(e)=>setWidth(e.target.value)}  />
                            </span>
                            <table className='table-editor'>
                                <tbody>
                                <tr>
                                    <td></td>
                                    <td style={{textAlign: 'center', verticalAlign: 'bottom'}}><input type='text'  value={top} onChange={(e)=>setTop(e.target.value)}  /></td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td style={{textAlign: 'right'}}><input type='text'  value={left} onChange={(e)=>setLeft(e.target.value)}  /></td>
                                    <td style={{border: '1px solid black', textAlign:'center', height:80, width: 80}}>Image</td>
                                    <td style={{textAlign: 'left'}}><input type='text'  value={right} onChange={(e)=>setRight(e.target.value)}  /></td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td  style={{textAlign: 'center', verticalAlign: 'top'}}><input type='text'  value={bottom} onChange={(e)=>setBottom(e.target.value)}  /></td>
                                    <td></td>
                                </tr>
                                </tbody>
                            </table>
                            <div style={{marginTop: 20, display: 'flex', flexDirection: 'row', justifyContent: 'end', gap: 10}}>
                                <button onClick={saveSetting}>сохранить</button>
                                <button onClick={deleteSetting}>удалить</button>
                            </div>
                        </div>
                    }
                </div>
            </div>

            {
                (images.length>0) &&
                <div className="edit-main">
                    {images.map((image, index) => (
                        <EditOne key={index} image={image} aspectRatioDef={aspectRatio} cropperRef={getCropperRef(index)} />
                    ))}
                </div>
            }


            {
                (images.length>0) ? 
                <span>
                     <label style={{marginLeft:15}}>Количество: {images.length}шт</label>
                     <button className='btn-save-editor' onClick={save} style={{background:progress&&'#a2a252'}}> <i style={{color: 'black', marginRight: 10}} className="bi bi-upload"></i> {progress?'Подготовка':'Скачать'}</button>
                     <button className='btn-delete-editor' onClick={clearFrame}>  очистить</button>

                </span>
                :
                <label style={{margin: 20}}> <i style={{color: 'black'}} className="bi bi-info-circle"></i> Выберете фото для обработки</label>
            }
            
        </div>
    );
} 

export default EditMain;