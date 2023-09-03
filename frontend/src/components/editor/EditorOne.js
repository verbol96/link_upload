import React, { useEffect, useState } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './styleEditor.css';


const EditorOne = ({ initialImageUrl, aspectRatioMain, cropperRef }) => {
  const [localAspectRatio, setLocalAspectRatio] = useState(aspectRatioMain);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  

  useEffect(() => {
    setLocalAspectRatio(aspectRatioMain);
  }, [aspectRatioMain]);

  useEffect(() => {
    const imageElement = cropperRef?.current;
    const cropper = imageElement?.cropper;
    if (cropper) {
      cropper.setAspectRatio(localAspectRatio);
      cropper.setCropBoxData({ left: 0, top: 0, width: cropper.getCanvasData().naturalWidth, height: cropper.getCanvasData().naturalHeight });
  }
  }, [imageUrl, localAspectRatio, cropperRef]);

  const rotateAspectRatio = () => {
    setLocalAspectRatio((prevAspectRatio) => {
      const newAspectRatio = 1 / prevAspectRatio;
      const imageElement = cropperRef?.current;
      const cropper = imageElement?.cropper;
      if (cropper) {
        cropper.setAspectRatio(newAspectRatio);
        cropper.setCropBoxData({ left: 0, top: 0, width: cropper.getCanvasData().naturalWidth, height: cropper.getCanvasData().naturalHeight });
      }
      return newAspectRatio;
    });
  };

  const addWhiteSpace = (canvas, paddingPercentage) => {
    const isWidthLess = canvas.width < canvas.height;
    const width = isWidthLess ? canvas.width + 2 * (canvas.width * (paddingPercentage / 100)) : canvas.width;
    const height = !isWidthLess ? canvas.height + 2 * (canvas.height * (paddingPercentage / 100)) : canvas.height;
  
    const newCanvas = document.createElement('canvas');
    newCanvas.width = width;
    newCanvas.height = height;
  
    const context = newCanvas.getContext('2d');
    context.fillStyle = '#fff'; // Задать цвет фона
    context.fillRect(0, 0, width, height); // Заполнить новый холст
    context.drawImage(canvas, isWidthLess ? width * (paddingPercentage / 100) : 0, !isWidthLess ? height * (paddingPercentage / 100) : 0, canvas.width, canvas.height); // Нарисовать старое изображение по центру
  
    return newCanvas;
  };

  const expandImage = () => {
    const imageElement = cropperRef?.current;
    const cropper = imageElement?.cropper;
    if (cropper) {
      const imageData = cropper.getImageData(); // Get original image data
      const canvas = document.createElement('canvas');
      canvas.width = imageData.naturalWidth;
      canvas.height = imageData.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageElement, 0, 0, imageData.naturalWidth, imageData.naturalHeight);
      const expandedCanvas = addWhiteSpace(canvas, 5); // 5% padding
      const expandedImage = expandedCanvas.toDataURL(); // Convert to data URL
      setImageUrl(expandedImage); // Set new image url
    }
  };

  const resetChanges = () => {
    setImageUrl(initialImageUrl); // Reset to the initial image URL
  };

  return (
    <div className="editor-one">
      <div className="edit-area">
      <Cropper
        src={imageUrl}
        aspectRatio={localAspectRatio}
        ref={cropperRef}
        style={{ height: '100%', width: '100%' }}
        viewMode={1}
        autoCropArea={1}
        className="cropper-container"
      />
      </div>
      <div className="button-group">
        <button onClick={rotateAspectRatio}><i className="bi bi-arrow-90deg-left"></i></button>
        <button onClick={expandImage}><i className="bi bi-arrows-angle-expand"></i></button>
        <button onClick={resetChanges}><i className="bi bi-arrow-repeat"></i></button>
      </div>
    </div>
  );

};
export default EditorOne;

