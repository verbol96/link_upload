import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import './styleEditor.css'
import 'react-easy-crop/react-easy-crop.css'

const EditorOne = ({ image, aspectRatioDef, cropperRef }) => {
  const imageURL = URL.createObjectURL(image);
  const [crop, setCrop] = useState({x: 0, y:0})
  const [cropSize, setCropSize] = useState()
  const [aspectRatio, setAspectRatio] = useState(aspectRatioDef)
  const [zoom, setZoom] = useState(1)
  const [forZoom, setForZoom] = useState(1)
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

  const onCropSizeChange = () =>{
    setTimeout(()=>{

      const dataImg = cropperRef.current.mediaSize
      const dataImgC = cropperRef.current.state.cropSize

      let x, y
      if(dataImg.width>dataImg.height){
        x = 0.85*cropperRef.current.containerRect.width
        y = x*aspectRatioDef
      }else{
        y = 0.85*cropperRef.current.containerRect.width
        x = y*aspectRatioDef
      }
      setCropSize({width: x, height: y})

      
      const value = Math.max(
          dataImgC.width / dataImg.width,
          dataImgC.height / dataImg.height,
      );
      setZoom(value);
      setForZoom(value);
    }, 30)
  }
  
  useEffect(() => {
    setAspectRatio(Number(aspectRatioDef));
    onCropSizeChange();// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatioDef]);

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

  const minZoom = () =>{
      if(btnActive){
        const media = cropperRef.current.mediaSize
        const value = Math.min(
          cropSize.height/media.height,
          cropSize.width/media.width,
      );
        return forZoom*value
      } 
      else return 1*forZoom
  }
  


  return (
    <div className='containerOne'>
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
                cropSize={cropSize}
                zoom={zoom}
                onCropSizeChange={onCropSizeChange}
                showGrid={false}
                aspect={aspectRatio}
                objectFit="cover"
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
            {/*<button onClick={()=>setAspectRatio(1/aspectRatio)}><i className="bi bi-arrow-counterclockwise"></i><i className="bi bi-aspect-ratio"></i></button>*/}
            <button onClick={()=>setRotation(rotation-90)}><i className="bi bi-arrow-counterclockwise"></i><i className="bi bi-image"></i></button>
            {/*<button onClick={()=>zooming(-0.05)}><i className="bi bi-zoom-out"></i></button>
            <button onClick={()=>zooming(0.05)}><i className="bi bi-zoom-in"></i></button>*/}
            <div className="zoomDiv">
              <input
                type="range"
                value={zoom}
                min={minZoom()}
                max={btnActive? 1.01*forZoom : 3*forZoom}
                step={0.01}
                aria-labelledby="Zoom"
                onChange={(e) => {
                  setZoom(e.target.value)
                }}
                className="zoom-range"
              />
            </div>
            
        </div>
    </div>
  </div>
  );
};



export default EditorOne;