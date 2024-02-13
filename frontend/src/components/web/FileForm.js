import { useRef , useEffect, useState} from "react";
import { ImgCard } from "./ImgCard";
import style from './FileForm.module.css'
import { useDispatch, useSelector } from 'react-redux'
import { saveSettings } from "../../store/orderReducer";
import { v4 as uuidv4 } from 'uuid'
import loadImage from 'blueimp-load-image'
import heic2any from "heic2any";
import { getSettings } from "../../http/dbApi";


export const FileForm = ({item, filesPrev, setFilesPrev, setFormats, formats, notLoad, setNotLoad}) =>{

    const fileInput = useRef(null); //для кастомного input(file)
    const dispach = useDispatch()

    const settings = useSelector(state=>state.order.settings)
    //const TypePhoto = ['photo', 'holst', 'magnit']
    const TypePhoto = ['photo', 'magnit']
    const FormatPhoto = settings.filter(el=>el.type==='photo')
    const FormatHolst = settings.filter(el=>el.type==='holst')
    const FormatMagnit = settings.filter(el=>el.type==='magnit')

    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            dispach(saveSettings(value))
        }
        getPriceList()
    },[dispach])

    const sizePhoto =()=>{
        switch(formats[item].type){
            case 'photo': return FormatPhoto
            case 'holst': return FormatHolst
            case 'magnit': return FormatMagnit
            default: return FormatPhoto
        }
    }

    const ChangeType = (e)=>{
        let formatValue
        if(e.target.value==='photo') formatValue=FormatPhoto[0].title
        if(e.target.value==='holst') formatValue=FormatHolst[0].title
        if(e.target.value==='magnit') formatValue=FormatMagnit[0].title
        setFormats([...formats.slice(0,item), {...formats[item], type: e.target.value, format: formatValue}, ...formats.slice(item+1)])
    }

    const ChangeSize = (e) =>{
        setFormats([...formats.slice(0,item), {...formats[item], format: e.target.value}, ...formats.slice(item+1)])
    }

    const ChangePaper = (e) =>{
        setFormats([...formats.slice(0,item), {...formats[item], paper: e.target.value}, ...formats.slice(item+1)])
    }

    const ChangeCopies = (e) =>{
        setFormats([...formats.slice(0,item), {...formats[item], copies: Number(e.target.value)}, ...formats.slice(item+1)])
    }

    const [load, setLoad] = useState({
        isLoad: false,
        count: 0
    })

    const UploadFiles = async(e) =>{
        const files = Array.from(e.target.files)

        const getBrowserName = () => {
            const agent = window.navigator.userAgent.toLowerCase();
          
            if (agent.indexOf('chrome') > -1 && agent.indexOf('safari') > -1) {
                return 'chrome';
            } else if (agent.indexOf('safari') > -1) {
                return 'safari';
            } else {
                return 'unknown';
            }
        }

        const createObj = async(file) =>{

            try {
                const type = file.name.split('.').pop().toLowerCase();

                if(file.size===0) return 0
              
                if (type === 'heic') {
                  if (getBrowserName() === 'safari') {
                    const asyncOperationWithPromise = async () => {
                      return new Promise((resolve, reject) => {
                        loadImage(
                          file,
                          (canvas) => {
                            canvas.toBlob(
                              (blob) => {
                                resolve({
                                  id: uuidv4(),
                                  name: file.name,
                                  file: blob
                                });
                              },
                              'image/jpeg'
                            );
                          },
                          { canvas: true }
                        );
                      });
                    };
              
                    return asyncOperationWithPromise().then((result) => {
                      const name = result.name.split('.')[0];
                      let file = new File([result.file], name + '.jpeg', { type: 'image/jpeg' });
                      const obj = {
                        id: uuidv4(),
                        file: file
                      };
                      return obj;
                    });
                  } else {
                    const result = await heic2any({
                      blob: file,
                      toType: 'image/jpeg'
                    });
                    const newfile = new File([result], file.name.split('.')[0] + '.jpeg', { type: 'image/jpeg' });
                    const obj = {
                      id: uuidv4(),
                      file: newfile
                    };
                    return obj;
                  }
                }
              
                if (type === 'webp' || type === 'bmp') {
                  const asyncOperationWithPromise = async () => {
                    return new Promise((resolve, reject) => {
                      loadImage(
                        file,
                        (canvas) => {
                          canvas.toBlob(
                            (blob) => {
                              resolve({
                                id: uuidv4(),
                                name: file.name,
                                file: blob
                              });
                            },
                            'image/jpeg'
                          );
                        },
                        { canvas: true }
                      );
                    });
                  };
              
                  return asyncOperationWithPromise().then((result) => {
                    const name = result.name.split('.')[0];
                    let file = new File([result.file], name + '.jpeg', { type: 'image/jpeg' });
                    const obj = {
                      id: uuidv4(),
                      file: file
                    };
                    return obj;
                  });
                }
              
                if (type === 'jpeg' || type === 'jpg' || type === 'png') {
                  const obj = {
                    id: uuidv4(),
                    file: file
                  };
                  return obj;
                }
              
                return 0;

              } catch (error) {
                console.log(error)
                return 0;
              }
            
        }

        const scaleImg = async(el) =>{
            return new Promise((resolve,reject)=>{
                
                const img = new Image();
                img.src = URL.createObjectURL(el.file);
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const scale = img.width/img.height

                    canvas.width = 400*scale; // ширина превью
                    canvas.height = 400; // высота превью

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(blob => {
                        const newFile = new File([blob], el.file.name, {type: el.file.type});
                        const obj = {
                            url: URL.createObjectURL(newFile),
                            id: el.id
                        }
                        resolve(obj);
                    });
                }
            })
        }

        const downloadImg = async() =>{
            setLoad({isLoad: true, count: files.length})
            for(const file of files){
                const original = await createObj(file)
                if(original === 0) {
                    setNotLoad(prevFilesPrevArray => {
                        let newFilesPrevArray = [...prevFilesPrevArray];
                        newFilesPrevArray[item] = [...newFilesPrevArray[item], file.name];
                        return newFilesPrevArray;
                    });
                    continue;
                }
                setFormats(prev => {
                    let newArr = [...prev];
                    newArr[item] = {
                    ...newArr[item],
                    files: [...newArr[item].files, original]
                    };
                    return newArr;
                });

                const preview = await scaleImg(original)
                setFilesPrev(prevFilesPrevArray => {
                    let newFilesPrevArray = [...prevFilesPrevArray];
                    newFilesPrevArray[item] = [...newFilesPrevArray[item], preview];
                    return newFilesPrevArray;
                });

            }
            setLoad({isLoad: false, count: 0})
        }

        downloadImg()

    }

    const deleteImg = (id) =>{ 
        setFormats([...formats.slice(0,item), {...formats[item], files: formats[item].files.filter(el=>el.id!==id)}, ...formats.slice(item+1)])
        setFilesPrev((prev)=>{
            const newM = prev[item].filter(el=>el.id!==id)
            let newPrev = prev
            newPrev[item] = [...newM]
            return newPrev
        })
    }

    const ShowTitle = (value) =>{
        switch(value){
            case 'photo': return 'Фото'
            case 'holst': return 'Холст'
            case 'magnit': return 'Магнит'
            case 'а6': return '10x15 стандарт'
            case 'дд': return '10x10 квадрат'
            case 'пол': return '10х12 полароид'
            case 'мини': return '7х9 миниПолароид'
            case 'а5': return '15х20'
            case 'а4': return '20х30'
            case '5x8': return '5х8'
            case '10x10': return '10х10'
            case '30x40': return '30x40'
            case '40x40': return '40x40'
            case '40x55': return '40x55'
            case '50x70': return '50x70'
            case '55x55': return '55x55'
            case '55x80': return '55x80'
            case '<а6': return 'другой до 10х15'
            case '<а7': return 'другой до 7.5х10'
            case '<а5': return 'другой до 15х20'
            case '<а4': return 'другой до 20х30'
            default: return false;
        }
    }

 

    return(
        <div className={style.filesFormFormat}>
            <div className={style.selectContainer}>
                <div className={style.containerSelect}>
                    <label className={style.labelSelect}>Тип:</label>
                    <select className={style.selectForm} value={formats[item].type} onChange={(e)=>ChangeType(e)}>
                        {TypePhoto.map((el,index)=><option value={el} key={index}>{ShowTitle(el)}</option>)}
                    </select>
                    <span className={style.selectArrow}>▼</span>
                </div>
                <div className={style.containerSelect}>
                    <label className={style.labelSelect}>Размер:</label>
                    <select className={style.selectForm} value={formats[item].format} onChange={(e)=>ChangeSize(e)}>
                        {sizePhoto().map((el,index)=>ShowTitle(el.title)&&<option key={index} value={el.title}>{ShowTitle(el.title)}</option>)}
                    </select>
                    <span className={style.selectArrow}>▼</span>
                </div>
                <div className={style.containerInput}> 
                    <label className={style.labelSelect}>Копий:</label>
                    <input className={style.selectForm} value={formats[item].copies} style={{textAlign: 'center', padding: 0}} onChange={(e)=>ChangeCopies(e)} />
                </div>
                {formats[item].type==='photo'
                ?
                <div className={style.containerSelect}>
                <label className={style.labelSelect}>Бумага:</label>
                    <select className={style.selectForm}  value={formats[item].paper} onChange={(e)=>ChangePaper(e)}>
                        <option value='glossy'>Глянец</option>
                        <option value='lustre'>Люстр</option>
                    </select>
                <span className={style.selectArrow}>▼</span>
                </div>
                :
                null
                }
            </div>
            <div className={style.cards}>
                <div className={style.cardFile} style={{border: '2px #2C3531 dashed'}}>
                    <label className={style.uploadLabel}  onClick={()=> fileInput.current.click()}>
                            <>  
                            {!load.isLoad 
                                ?
                                    <>
                                    <div style={{fontSize: 30, textAlign: 'center'}}>
                                        <i style={{color:'black'}} className="bi bi-plus"></i>
                                    </div>
                                    <div style={{textAlign: 'center', padding: 5}}>
                                    добавить фото
                                    </div>
                                    </>
                                :
                                    <>
                                        {filesPrev.length} из {load.count}
                                    </>
                                }                           
                            
                            </>
                    </label>
                    <input style={{display: 'none'}} ref={fileInput} type="file" multiple={true} onChange={(e)=>UploadFiles(e)}></input>
                </div>

                {filesPrev && filesPrev.map((el, index) => {
                    return <ImgCard key={index} image={el} deleteImg={deleteImg} />
                })}

            </div>

            <div className={style.notLoad}>
                {notLoad[item].map((el, index)=> <div className={style.notLoadRow} key={index}>{el} - формат не поддерживается</div>)}
            </div>
        </div>
    )
}