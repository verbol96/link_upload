const {User, File} = require('../models/models')
require('dotenv').config()
const FileService = require('../services/fileService')
const fs = require('fs')
const JSZip = require('jszip')
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp');

class fileController {
    async createDir(req, res){
        try { 
            const {name, type, parent} = req.body
            let file
            if(parent){
                const parentFile = await File.findOne({where:{id: parent}})
                const path = `${parentFile.name}`
                const newName = await FileService.createdDir(name, path)
                file = await File.create({name: newName.name, type, parent, path})
            }else{
                await FileService.createdDir(name)
                file = await File.create({name, type, parent: '00000000-0000-0000-0000-000000000000'})
            } 
            return res.json(file)
        } catch (error) {
            console.log(error)
            return res.status(400).json(error)
        }  
    }

    async getFiles(req,res){
        try {
            let files
            if(req.query.parent){
                 files = await File.findAll({where:{parent: req.query.parent}})
            }else{
                 files = await File.findAll({where: {parent: '00000000-0000-0000-0000-000000000000'}})
                 if(!files) 
                 {
                    return res.json('нету файлов')
                 }
            }
            
            return res.json(files)
            
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "не получены файлы"})
        }
    }

    async getFilesAll(req,res){
        try {
            const files = await File.findAll()
            
            
            return res.json(files)
            
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "не получены файлы"})
        }
    }

    async uploadFiles(req,res){
        try {
            const file = req.files.file
            const fileId = req.body.id
            const fileName = req.body.fileName
            file.name = fileName
            
            const parent = await File.findOne({where:{id: req.body.parent}})
            let path = `${process.env.FILEPATH}/${parent.path}/${parent.name}/${file.name}` 
            if(fs.existsSync(path)){
                return res.status(400).json({message: "файл уже существукет"})
            }
            
            file.mv(path) //перемещение файла по пути
            const type = file.name.split('.').pop()
            
            const dbFile = {
                name: fileName,
                type,
                size: file.size,
                path:  `${parent.path}/${parent.name}`,
                parent: parent.id,
                photoId: fileId
            }

            const fileFull = await File.create(dbFile)
            return res.json(fileFull)
            
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "ошибка загрузки"})
        }
    }

    async deleteFile(req,res){
        try {
            
            const file = await File.findOne({where:{id: req.query.id}})
            if(!file) return res.status(400).json({message: "файл не найден"})
    
            if(file.type==='dir'){
    
                const DeleteDir = async(id, fileMain)=>{
                    const files = await File.findAll({where: {parent: id}})
    
                    for await(const el of files){
                        
                        if(el.type==='dir'){
                            
                            await DeleteDir(el.id, el)
                            
                        }else{
                            await File.destroy({where:{id: el.id}})
                            try {
                                FileService.deleteFile(el)
                            } catch (error) {
                                console.error(`Error deleting file ${el.id}: ${error}`)
                            }
                        }
                    }
                    await File.destroy({where:{id: fileMain.id}})
                    try {
                        FileService.deleteFile(fileMain)
                    } catch (error) {
                        console.error(`Error deleting directory ${fileMain.id}: ${error}`)
                    }
                }
    
                await DeleteDir(file.id, file)
    
                
                return res.json({message:'дирректория удалена'})
            }else{
                
                await File.destroy({where:{id: file.id}})
                try {
                    FileService.deleteFile(file)
                } catch (error) {
                    console.error(`Error deleting file ${file.id}: ${error}`)
                }
                return res.json({message:"файл удален"})
            }
            
        } catch (error) {
            console.log(error)
            return res.status(400).json({message: "ошибка при удалении"})
        }
    }

    async downloadFile(req,res){
        
        try {
            const file = await File.findOne({where:{id: req.query.id}})
            const path = `${process.env.FILEPATH}/${file.path}/${file.name}`

            if(file.type==='dir'){
                var zip = new JSZip();

                const AddToZip = async(id, a)=>{
                    const files = await File.findAll({where: {parent: id}})

                    for await(const el of files){
                        
                        if(el.type==='dir'){
                            let folder
                            if(a){
                                 folder = a.folder(`${el.name}`)
                            }
                            else  folder = zip.folder(`${el.name}`)
                            await AddToZip(el.id, folder)
                            
                        }else{
                            if(a){a.file(`${el.dataValues.name}`, fs.readFileSync(`${process.env.FILEPATH}/${el.dataValues.path}/${el.dataValues.name}`) , {base64: true})}
                            else zip.file(`${el.dataValues.name}`, fs.readFileSync(`${process.env.FILEPATH}/${el.dataValues.path}/${el.dataValues.name}`) , {base64: true})
                         }
                    }
                }
                
                await AddToZip(file.id)
                console.log('here')

                const content = await zip.generateAsync({type: 'nodebuffer'})
                const downloadPath = `${process.env.FILEPATH}/download.zip`
                fs.writeFileSync(downloadPath, content)
                return res.download(downloadPath)
            }else{
                return res.download(path)
            }

        } catch (error) {
            return res.status(400).json({message:"ошибка скачивания"})
        }
    }

    async deleteFileAll(req,res){
        try {
            await File.destroy({
                where: {},
              });
            // Удаление всех файлов из папки 'file'
            FileService.deleteFolderContents(process.env.FILEPATH)
            return res.json({message:'облако очищено'})
           
        } catch (error) {
            return res.status(400).json({message: "ошибка при удалении"})
        }
    }
    
    async displayFile(req, res) {
        try {
            const file = await File.findOne({ where: { id: req.query.id } });
            if (!file) return res.status(404).json({ message: "Файл не найден" });
    
            const filePath = path.join(process.env.FILEPATH, file.path, file.name);
    
            if (file.type !== 'dir') {
                const contentType = mime.contentType(path.extname(filePath)) || 'application/octet-stream';
    
                res.contentType(contentType);
    
                if (mime.lookup(filePath).startsWith('image/')) {

                    sharp(filePath)
                        .resize(200) // Измените на желаемый размер
                        .toBuffer()
                        .then(data => {
                            res.end(data); // Отправляем сжатое изображение
                        })
                        .catch(err => {
                            console.error('Error processing image', err);
                            res.status(500).json({ message: "Ошибка при обработке изображения" });
                        });
                } else {
                    res.sendFile(filePath);
                }
            } else {
                res.status(400).json({ message: "Невозможно отобразить директорию" });
            }
        } catch (error) {
            console.error('Error in displayFile:', error);
            res.status(500).json({ message: "Ошибка при попытке отобразить файл" });
        } 
    }

    async getFilesPhotosId(req,res){
        const id = req.body.id

        try {
            const files = await File.findAll({where:{photoId: id}})
            return res.json(files)
            
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "не получены файлы"})
        }
    }

}


module.exports = new fileController()