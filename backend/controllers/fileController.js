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
            const file = await File.create({name, type, parent, userId: req.user.id})
            let parentFile
            if(parent) parentFile = await File.findOne({where:{id: parent}})

            let path
            if(!parentFile){
                 path = req.user.phone
                await FileService.createdDir(file, path)
            } else{
                 path = `${parentFile.path}/${parentFile.name}`
                 
                await FileService.createdDir(file, path)
            }
            const a = await File.update({path: path}, {where: {id:file.id}})
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
                 files = await File.findAll({where:{userId: req.user.id, parent: req.query.parent}})
            }else{
                    //console.log('here')
                 files = await File.findAll({where: {userId: req.user.id, parent: '0'}})
                 if(!files) return res.json('нету файлов')
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
            let parent = 0
            
            /*if(req.body.parent){
                parent = await File.findOne({where:{id: req.body.parent}})
            }

            
            if(parent===0){ 
                path = `${process.env.FILEPATH}/${req.user.phone}/${file.name}`
                
            }else{
                path = `${process.env.FILEPATH}/${parent.path}/${parent.name}/${file.name}`
            }*/
            let path = `${process.env.FILEPATH}/${file.name}`
            

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
                path: (parent!==0) ? `${parent.path}/${parent.name}` : req.user.phone,
                parent: parent.id,
                userId: req.user.id
            }

            const fileFull = await File.create(dbFile)
            //const user = await User.findOne({where:{id:req.user.id}})
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