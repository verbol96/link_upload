import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import './styleEditor.css'
import 'react-easy-crop/react-easy-crop.css'

const EditorOne = ({ image, aspectRatioDef, cropperRef }) => {
  const imageURL = URL.createObjectURL(image);
  const [crop, setCrop] = useState({x: 0, y:0})
  const [aspectRatio, setAspectRatio] = useState(aspectRatioDef)
  const [zoom, setZoom] = useState(1)
  const [btnActive, setBtnActive] = useState(false)
  const [rotation, setRotation] = useState(0)

  const onCropChange = useCallback((newCrop) => {
    setCrop(prevCrop => {
      if (areCropsSimilar(prevCrop, newCrop)) {
        return prevCrop;
      }
      return newCrop;
    });
  }, []);
  
  const areCropsSimilar=(crop1, crop2)=>{
    const epsilon = 0.01; // некоторое маленькое число
    return Math.abs(crop1.x - crop2.x) < epsilon &&
           Math.abs(crop1.y - crop2.y) < epsilon;
  }



  useEffect(() => {
    setAspectRatio(Number(aspectRatioDef));
    }, [aspectRatioDef]);

    const zooming = (value) => {
        
        const newZoom = zoom + value;
        const newImageSize = { 
          width: cropperRef.current.state.cropSize.width * newZoom, 
          height: cropperRef.current.state.cropSize.height * newZoom 
        };

        if(btnActive){
            setZoom(newZoom);
        }else{
            if (newImageSize.width < cropperRef.current.state.cropSize.width || newImageSize.height < cropperRef.current.state.cropSize.height) {
                return;
            }else{
                setZoom(newZoom);
            }
        }
        
      }

      const addField = () => {
        const dataImg = cropperRef.current.mediaSize
        const dataImgC = cropperRef.current.state.cropSize

        if(!btnActive){
            const value = Math.min(
                dataImgC.width / dataImg.width,
                dataImgC.height / dataImg.height,
            );
            setZoom(value);
            setCrop({ x: 0, y: 0 });
        }else{
            const value = Math.max(
                dataImgC.width / dataImg.width,
                dataImgC.height / dataImg.height,
            );
            setZoom(value);
        }

        setBtnActive(!btnActive)
    
    }

  return (
    <div className="image-block">
    <div className="image-info">
        <label>{image.name}</label>
        <button 
            onClick={addField}
            style={{background:btnActive&&'#8b8b8b'}}
            >с полями</button>
    </div>
    
    <div className="image-cropper">
        <Cropper
            image={imageURL}
            ref={cropperRef}
            crop={crop}
            zoom={zoom}
            showGrid={false}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            restrictPosition={btnActive?false:true}
            rotation={rotation}
            classes={{
                containerClassName: 'containerClassName',
                mediaClassName: 'mediaClassName',
                cropAreaClassName: 'cropAreaClassName',
            }}
        />
    </div>
    
    <div className="image-button-group">
        <button onClick={()=>setAspectRatio(1/aspectRatio)}><i className="bi bi-arrow-counterclockwise"></i><i className="bi bi-aspect-ratio"></i></button>
        <button onClick={()=>setRotation(rotation-90)}><i className="bi bi-arrow-counterclockwise"></i><i className="bi bi-image"></i></button>
        <button onClick={()=>zooming(-0.05)}><i className="bi bi-zoom-out"></i></button>
        <button onClick={()=>zooming(0.05)}><i className="bi bi-zoom-in"></i></button>
    </div>
</div>
  );
};



export default EditorOne;