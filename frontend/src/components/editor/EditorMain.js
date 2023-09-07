import React, { useState, useRef, useEffect } from 'react';
import EditorOne from './EditorOne';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './styleEditor.css';
import { ClipLoader } from 'react-spinners';
import {$host} from '../../http/index'


const EditorMain = () => {
  const [images, setImages] = useState([]);

  const [settingEditor, setSettingEditor] = useState([])
  const [size, setSize] = useState()
  const [up, setUp] = useState('')
  const [down, setDown] = useState('')
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [aspectRatio, setAspectRatio] = useState('');

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const cropperRefs = useRef([]);

  useEffect(() => {
    cropperRefs.current = cropperRefs.current.slice(0, images.length);
  }, [images]);



  useEffect(()=>{
    async function getSettingEditor() {
      const { data } = await $host.get('api/settings/getSettingsEditor');
      setSettingEditor(data);
      if(!data){
        setSize(data[0].size)
        setUp(data[0].up)
        setDown(data[0].down)
        setLeft(data[0].left)
        setRight(data[0].right)
        setAspectRatio(data[0].aspectRatio)
      }else{
        setSize('1')
        setUp('1')
        setDown('1')
        setLeft('1')
        setRight('1')
        setAspectRatio('1')
      }

    }
    getSettingEditor();
  }, [])

  

  const handleImageUpload = (event) => {
    setLoading(true);
    const files = Array.from(event.target.files);
    let i = 0;

    const readFile = () => {
        if (i >= files.length) {
            setLoading(false); // set loading to false after all images are loaded
            return;
          }

        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = () => {
            setImages((oldImages) => [...oldImages, { data: reader.result, name: file.name }]);
            cropperRefs.current.push(React.createRef());

            i++;
            readFile();

        };
        reader.readAsDataURL(file);
    };

    readFile();
};

  const handleAspectRatioChange = (event) => {
    setSize(event.target.value);
    setAspectRatio(settingEditor.find(el=>el.size===event.target.value).aspectRatio)
    setUp(settingEditor.find(el=>el.size===event.target.value).up)
    setDown(settingEditor.find(el=>el.size===event.target.value).down)
    setLeft(settingEditor.find(el=>el.size===event.target.value).left)
    setRight(settingEditor.find(el=>el.size===event.target.value).right)
  };

  const deleteImages = ()=>{
    setImages([])
  }

  
const handleDownloadMini = () => {
    const zip = new JSZip();
  
    const imagePromises = cropperRefs.current.map((cropperRef, index) => {
        if(index % 2 === 0) {
            return new Promise((resolve, reject) => {
                if (cropperRef.current && cropperRef.current.cropper) {
                  const cropper = cropperRef.current.cropper;
                  let croppedCanvas = cropper.getCroppedCanvas();
                  const borderSize = { top: Number(up), right: Number(right), bottom: Number(down), left: Number(left) };
          
                  // Create a new canvas to resize the cropped canvas
                  const resizeCanvas = document.createElement('canvas');
                  const resizeContext = resizeCanvas.getContext('2d');
                  resizeCanvas.height = 1000;
                  resizeCanvas.width = (croppedCanvas.width / croppedCanvas.height) * 1000;
                  
                  // Draw the cropped canvas onto the resizing canvas
                  resizeContext.drawImage(croppedCanvas, 0, 0, resizeCanvas.width, resizeCanvas.height);
                  croppedCanvas = resizeCanvas;  // Replace the original cropped canvas with the resized one
          
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
          
                  // Increase the canvas size to accommodate two images side by side and a thin black line between them
                  canvas.width = 2 * (croppedCanvas.width + croppedCanvas.width * (borderSize.right + borderSize.left)) + 1; // +1 for the black line
                  canvas.height = croppedCanvas.height + croppedCanvas.height * (borderSize.top + borderSize.bottom);
          
                  context.fillStyle = 'white';
                  context.fillRect(0, 0, canvas.width, canvas.height);
          
                  // Draw the first image
                  context.drawImage(croppedCanvas, croppedCanvas.width * borderSize.left, croppedCanvas.height * borderSize.top);
          
                  // Draw a thin black line in the middle of the canvas
                  context.fillStyle = 'black';
                  context.fillRect(canvas.width / 2, 0, 1, canvas.height);
          
                  // If there is a next image, draw it next to the current image and the black line
                  if (index < cropperRefs.current.length - 1) {
                    const nextCropperRef = cropperRefs.current[index + 1];
                    if (nextCropperRef.current && nextCropperRef.current.cropper) {
                      let nextCroppedCanvas = nextCropperRef.current.cropper.getCroppedCanvas();
          
                      // Create a new canvas to resize the next cropped canvas
                      const nextResizeCanvas = document.createElement('canvas');
                      const nextResizeContext = nextResizeCanvas.getContext('2d');
                      nextResizeCanvas.height = 1000;
                      nextResizeCanvas.width = (nextCroppedCanvas.width / nextCroppedCanvas.height) * 1000;
          
                      // Draw the next cropped canvas onto the resizing canvas
                      nextResizeContext.drawImage(nextCroppedCanvas, 0, 0, nextResizeCanvas.width, nextResizeCanvas.height);
                      nextCroppedCanvas = nextResizeCanvas;  // Replace the original next cropped canvas with the resized one
          
                      context.drawImage(nextCroppedCanvas, canvas.width / 2 + 1 + croppedCanvas.width * borderSize.left, croppedCanvas.height * borderSize.top); // +1 to accommodate the black line
                    }
                  }
          
                  const imageDataUrl = canvas.toDataURL('image/png');
                  const imageData = atob(imageDataUrl.substring(22));
                  const arraybuffer = new ArrayBuffer(imageData.length);
                  const view = new Uint8Array(arraybuffer);
                  for (let i=0; i<imageData.length; i++) {
                    view[i] = imageData.charCodeAt(i) & 0xff;
                  }
                  const blob = new Blob([view], {type: 'image/png'});
                  
                  const image = images[index];
                  zip.file(image.name.replace(/\.[^/.]+$/, "") + ".png", blob);
                  resolve();
                } else {
                  console.log('error')
                  reject();
                }
              });
        } else { return null}
      
    });
  
    Promise.all(imagePromises).then(() => {
        zip.generateAsync({type:"blob"})
          .then(content => {
            saveAs(content, `${size}.zip`);
          }).catch(error => console.error('Error in zip.generateAsync:', error));
      }).catch(error => console.error('Error in Promise.all:', error));
  };

  const processImage = async (image, i, totalImages, zip, cropperRef) => {
            const borderSize = { top: Number(up), right: Number(right), bottom: Number(down), left: Number(left) };
            const cropper = cropperRef.current.cropper;
            const croppedCanvas = cropper.getCroppedCanvas();

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = croppedCanvas.width + croppedCanvas.width * (borderSize.right + borderSize.left);
            canvas.height = croppedCanvas.height + croppedCanvas.height * (borderSize.top + borderSize.bottom);

            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(croppedCanvas, croppedCanvas.width * borderSize.left, croppedCanvas.height * borderSize.top);

            const imageDataUrl = canvas.toDataURL('image/png');
            const imageData = atob(imageDataUrl.substring(22));
            const arraybuffer = new ArrayBuffer(imageData.length);
            const view = new Uint8Array(arraybuffer);

            for (let j = 0; j < imageData.length; j++) {
                view[j] = imageData.charCodeAt(j) & 0xff;
            }

            const blob = new Blob([view], {type: 'image/png'});
            const image1 = images[i];
            zip.file(image1.name.replace(/\.[^/.]+$/, "") + ".png", blob);

            const currentProgress = ((i + 1) / totalImages) * 100;
    await new Promise(resolve => setTimeout(resolve, 100));  // Задержка в 100 мс
    setProgress(currentProgress.toFixed(0));
    
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    
    
    const totalImages = cropperRefs.current.length;
    setProgress(0);
    for (let i = 0; i < totalImages; i++) {
        const cropperRef = cropperRefs.current[i];
        if (cropperRef.current && cropperRef.current.cropper) {
          await processImage(images[i], i, totalImages, zip, cropperRef);
        } else {
            console.log('error');
            throw new Error(`Error processing image at index ${i}`);
        }
        
    }
    setProgress(100); 

    try {
        const content = await zip.generateAsync({type:"blob"});
        saveAs(content, `${size}.zip`);
    } catch (error) {
        console.error("Error generating zip file:", error);
    }
}

const getCropperRef = (index) => {
    if (!cropperRefs.current[index]) {
        // Создание новой ссылки, если она еще не существует
        cropperRefs.current[index] = React.createRef();
    }
    return cropperRefs.current[index];
}

const [isParam, setIsParam] = useState(false)

const ShowParam = () =>{
  isParam?setIsParam(false):setIsParam(true)
}

const ChangeSettings = async()=>{
  const userConfirmation = window.confirm("Вы уверены, что хотите изменить?");
    
  if (userConfirmation) {
    const data1 = {
      size,
      aspectRatio,
      up,
      down,
      left,
      right
    }
    await $host.put('api/settings/changeSettingsEditor', data1);
    const { data } = await $host.get('api/settings/getSettingsEditor');
        setSettingEditor(data);
        setSize(data[0].size)
        setUp(data[0].up)
        setDown(data[0].down)
        setLeft(data[0].left)
        setRight(data[0].right)
        setAspectRatio(data[0].aspectRatio)
  }
 
}

const DeleteSettings = async()=>{
  const userConfirmation = window.confirm("Вы уверены, что хотите удалить?");
    
  if (userConfirmation) {
    await $host.delete(`api/settings/deleteSettingsEditor/${size}`);
    const { data } = await $host.get('api/settings/getSettingsEditor');
        setSettingEditor(data);
        setSize(data[0].size)
        setUp(data[0].up)
        setDown(data[0].down)
        setLeft(data[0].left)
        setRight(data[0].right)
        setAspectRatio(data[0].aspectRatio)
  }
 
}

const progressStyle = {
  height: '20px',
  width: `${progress}%`,
  backgroundColor: '#627173',
  transition: 'width 0.3s ease-in-out',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const containerStyle = {
  width: '100%',
  backgroundColor: '#fff',
  border: '1px #627173 solid',
  borderRadius: '5px',
  overflow: 'hidden',
};

  return (
    <div>
        <div className='editor-menu'>
            <label htmlFor="upload" className="input-file">
                <div style={{textAlign: 'center', padding: 5, wordWrap: 'break-word'}}>
                     выбрать фото
                </div>
            <input type="file" id="upload" style={{display: "none"}} onChange={handleImageUpload} multiple />
            </label>

            <div className="select-container">
            <select className="select-ratio" value={size} onChange={handleAspectRatioChange}>
                {settingEditor.map(el=><option key={el.id} value={el.size}>{el.size}</option>)}
               
            </select>
            </div>
            
            <button className='button-param' onClick={()=>ShowParam()}>параметры</button>
            
        </div>

        {
        isParam &&
        <div className='param'>
            <div>имя:</div>
            <input className='inputParam' value={size} onChange={(e)=>setSize(e.target.value)} />
            <div>X/Y:</div>
            <input className='inputParam' value={aspectRatio} onChange={(e)=>setAspectRatio(e.target.value)} />
            <div>верх:</div>
            <input className='inputParam' value={up} onChange={(e)=>setUp(e.target.value)} />
            <div>низ:</div>
            <input className='inputParam' value={down} onChange={(e)=>setDown(e.target.value)} />
            <div>лево:</div>
            <input className='inputParam' value={left} onChange={(e)=>setLeft(e.target.value)} />
            <div>право:</div>
            <input className='inputParam' value={right} onChange={(e)=>setRight(e.target.value)} />
            <div><button style={{marginLeft: 40}} onClick={()=>ChangeSettings()}>изменить</button></div>
            <div><button style={{marginLeft: 70}} onClick={()=>DeleteSettings()}>удалить</button></div>
        </div>
        }

      {loading && <ClipLoader size={100} />}

      
        
      <div className="editor-main">
      {images.map((image, index) => (
        <EditorOne
            key={index}
            initialImageUrl={image.data}
            cropperRef={getCropperRef(index)}
            aspectRatioMain={aspectRatio}
        />
        ))}
      </div>
      {progress===0 || progress===100 ? <div></div>:<div style={{width: '30%', marginLeft: 20}}><div style={containerStyle}>
        <div style={progressStyle}>{`${progress}%`}</div>
        </div></div>}

      
      <div className='btn-group'>
        <button onClick={size==='7x9'? handleDownloadMini : handleDownload}>Скачать все</button>
        <button onClick={deleteImages}>очистить</button>
      </div>
      
    </div>
  );
};



export default EditorMain;