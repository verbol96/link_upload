import React, { useState, useRef, useEffect } from 'react';
import EditorOne from './EditorOne';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './styleEditor.css';
import { ClipLoader } from 'react-spinners';


const EditorMain = () => {
  const [images, setImages] = useState([]);
  const [aspectRatio, setAspectRatio] = useState("1");
  const [printSize, setPrintSize] = useState('7x9');
  const [loading, setLoading] = useState(false);
  const cropperRefs = useRef([]);

  useEffect(() => {
    cropperRefs.current = cropperRefs.current.slice(0, images.length);
  }, [images]);

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
    const [aspectRatio, printSize] = event.target.value.split('_');
    setAspectRatio(parseFloat(aspectRatio));
    setPrintSize(printSize);
  };

  const deleteImages = ()=>{
    setImages([])
  }

  const borderSizes = {
    '7x9': { top: 0.13, right: 0.13, bottom: 0.36, left: 0.13 },
    '10x15': { top: 0, right: 0, bottom: 0, left: 0 },
    '10x12': { top: 0.11, right: 0.11, bottom: 0.73, left: 0.11 },
    '10x10': { top: 0.059, right: 0.059, bottom: 0.6, left: 0.059 },
    '9x13': { top: 0, right: 0, bottom: 0, left: 0 },
};

  
const handleDownloadMini = () => {
    const zip = new JSZip();
  
    const imagePromises = cropperRefs.current.map((cropperRef, index) => {
        if(index % 2 === 0) {
            return new Promise((resolve, reject) => {
                if (cropperRef.current && cropperRef.current.cropper) {
                  const cropper = cropperRef.current.cropper;
                  let croppedCanvas = cropper.getCroppedCanvas();
                  const borderSize = borderSizes[printSize];
          
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
            saveAs(content, `${printSize}.zip`);
          }).catch(error => console.error('Error in zip.generateAsync:', error));
      }).catch(error => console.error('Error in Promise.all:', error));
  };



  const handleDownload = async () => {
    const zip = new JSZip();
    const borderSize = borderSizes[printSize];

    for (let i = 0; i < cropperRefs.current.length; i++) {
        const cropperRef = cropperRefs.current[i];
        if (cropperRef.current && cropperRef.current.cropper) {
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
            const image = images[i];
            zip.file(image.name.replace(/\.[^/.]+$/, "") + ".png", blob);
        } else {
            console.log('error');
            throw new Error(`Error processing image at index ${i}`);
        }
    }

    try {
        const content = await zip.generateAsync({type:"blob"});
        saveAs(content, `${printSize}.zip`);
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
            <select className="select-ratio" value={`${aspectRatio}_${printSize}`} onChange={handleAspectRatioChange}>
                <option value="1_7x9">Полароид(7x9)</option>
                <option value="0.6666666666666666_10x15">Стандарт(10х15)</option>
                <option value="1_10x12">Полароид(10х12)</option>
                <option value="1_10x10">Квадрат(10х10)</option>
                <option value="0.6923_9x13">9х13</option>
            </select>
            </div>
        </div>

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

      <div className='btn-group'>
        <button onClick={printSize==='7x9'? handleDownloadMini : handleDownload}>Скачать все</button>
        <button onClick={deleteImages}>очистить</button>
      </div>
      
    </div>
  );
};

export default EditorMain;