//import { useState } from "react"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ListCloud } from "../components/cloud/ListCloud"
import {deleteFile, getFiles, getFilesAll} from '../http/cloudApi'
import {setFiles, setCurrentDir, setFilesAll, delStack, deleteFileStore} from '../store/fileReducer'
import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar"

 
const Cloud = () =>{
    const dispatch = useDispatch()
    const currentDir = useSelector(state=>state.files.currentDir)
    const stackDir = useSelector(state=>state.files.stackDir)
    const stack = useSelector(state=>state.files.stack)
    const filesAll = useSelector(state=>state.files.filesAll)
    const files = useSelector(state=>state.files.files)

    useEffect(()=>{ 
        async function getFile (){
            let value = await getFiles(currentDir)
            dispatch(setFiles(value))
        }
        getFile()
        
    },[currentDir, dispatch])

    useEffect(()=>{
        async function getFileAll (){
            let value1 = await getFilesAll()
            dispatch(setFilesAll(value1))
        }
        getFileAll()
        
    },[dispatch])

    const BackClick = () =>{
        const backDir = stackDir.pop()
        dispatch(setCurrentDir(backDir))
        dispatch(delStack())
    }

    const getTotalSize = (files) => files.reduce((total, file) => total + file.size, 0) / (1024 * 1024 * 1024);

    const isDateOlderThan14Days = (dateString) => {
        const currentDate = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(currentDate.getDate() - 14);
        const date = new Date(dateString);
        return date < thirtyDaysAgo;
    }

    const deleteFileClick = async(el) => {
        await deleteFile(el.id)
        dispatch(deleteFileStore(el.id))
    }

    useEffect(() => {
        const ClearCloud = async () => {
          if (files.length > 0) {
            const oldFiles = files.filter(el => isDateOlderThan14Days(el.createdAt));
            if (oldFiles.length > 0) {
                for (const el of oldFiles) {
                  try {
                    await deleteFileClick(el);
                  } catch (error) {
                    console.error(`Ошибка при удалении файла ${el.name}:`, error);
                  }
                }
            }
          }
        };
      
        ClearCloud();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

    return (
        <div className="flex flex-col bg-stone-100 min-h-screen">
            <NavBar />

            <div className="flex flex-row items-center gap-2 mt-4 mx-10">
                <div className="shrink-0 w-[50px]">
                    <button
                        className="w-full h-10 bg-white border border-stone-300 rounded-md
                                flex items-center justify-center
                                text-stone-600 hover:bg-stone-50 hover:border-stone-400
                                transition-colors"
                        onClick={currentDir ? () => BackClick() : null}
                    >
                        <i className="bi bi-arrow-left"></i>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 min-w-0 text-[13px] text-stone-600 ml-4">
                    <span className="font-medium text-stone-700 shrink-0 whitespace-nowrap">
                        Все файлы
                    </span>
                    {stack.map((el, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5 min-w-0">
                            <i className="bi bi-chevron-right text-[10px] text-black shrink-0"></i>
                            <span className="truncate">{el}</span>
                        </span>
                    ))}
                </div>

                <div className="ml-auto shrink-0">
                    <h6 className="text-[14px] text-stone-600 tabular-nums font-medium">
                        {`Память: ${getTotalSize(filesAll).toFixed(2)}gb / 60gb`}
                    </h6>
                </div>
            </div>

            <ListCloud />
            
            <div style={{marginTop: 'auto'}}>
                <Footer />
            </div>

        </div>
    )
}

export default Cloud

