const {User, File} = require('../models/models')
require('dotenv').config()
const FileService = require('../services/fileService')
const fs = require('fs')
const archiver = require('archiver')
const zlib = require("zlib");
const JSZip = require('jszip')

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

    async uploadFiles(req,res){
        try {
            const file = req.files.file
            
            const parent = await File.findOne({where:{id: req.body.parent}})
            let path = `${process.env.FILEPATH}/${parent.path}/${parent.name}/${file.name}` 
            if(fs.existsSync(path)){
                return res.status(400).json({message: "файл уже существукет"})
            }
            console.log(path)
            file.mv(path) //перемещение файла по пути
            const type = file.name.split('.').pop()

            const dbFile = {
                name: file.name,
                type,
                size: file.size,
                path:  `${parent.path}/${parent.name}`,
                parent: parent.id
            }

            const fileFull = await File.create(dbFile)
            return res.json(fileFull)
            
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "ошибка загрузки"})
        }
    }

    async uploadFilesNull(req,res){
        try {
            const file = req.files.file
            let path = `${process.env.FILEPATH}/E4/${file.name}` 
            file.mv(path) //перемещение файла по пути
            
            return res.json('done!')
            
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
                            FileService.deleteFile(el)
                            await File.destroy({where:{id: el.id}})
                        }
                    }
                    FileService.deleteFile(fileMain)
                    await File.destroy({where:{id: fileMain.id}})
                }

                await DeleteDir(file.id, file)

                
                return res.json({message:'дирректория удалена'})
            }else{
                
                FileService.deleteFile(file)
                await File.destroy({where:{id: file.id}})
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

   
}

module.exports = new fileController()