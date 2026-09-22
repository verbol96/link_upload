const {User, File, Photo, Order} = require('../models/models')
require('dotenv').config()
const FileService = require('../services/fileService')
const fs = require('fs')
const JSZip = require('jszip')
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp');
const moment = require('moment-timezone');
const { where } = require('sequelize')

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
                file = await File.create({name, type, parent: '00000000-0000-0000-0000-000000000000', isDownload: false})
            } 
            return res.json(file)
        } catch (error) {
            console.log(error)
            return res.status(400).json(error)
        }  
    }

    async getFiles(req,res){
        try {
            let files1
            if(req.query.parent){
                 files1 = await File.findAll({where:{parent: req.query.parent}})
            }else{
                 files1 = await File.findAll({where: {parent: '00000000-0000-0000-0000-000000000000'}})
                 if(!files1) 
                 {
                    return res.json('нету файлов')
                 } 
            }

            const files = files1.map(order => {
                const moscowTime = moment(order.createdAt).tz('Europe/Moscow'); // Преобразование в Московскую временную зону
                return {
                  ...order.toJSON(),
                  createdAt: moscowTime.format() // Форматирование даты и времени в строку
                };
              });
            
            return res.json(files)
            
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "не получены файлы"})
        }
    }

    async getFilesAll(req,res){
        try {
            const files1 = await File.findAll()
            
            const files = files1.map(order => {
                const moscowTime = moment(order.createdAt).tz('Europe/Moscow'); // Преобразование в Московскую временную зону
                return {
                    ...order.toJSON(),
                    createdAt: moscowTime.format() // Форматирование даты и времени в строку
                };
            });
            
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
            let filePath = `${process.env.FILEPATH}/${parent.path}/${parent.name}/${file.name}`;
            let fileExists = fs.existsSync(filePath);
            let count = 1;
            let newFileName =   fileName  

            while (fileExists) {
                const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
                const fileExtension = file.name.split('.').pop();
                newFileName = `${fileNameWithoutExtension} (${count}).${fileExtension}`;
                filePath = `${process.env.FILEPATH}/${parent.path}/${parent.name}/${newFileName}`;
                fileExists = fs.existsSync(filePath);
                count++;
            }

            file.mv(filePath);
            const type = file.name.split('.').pop()
            
            const dbFile = {
                name: newFileName,
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

async downloadFile(req, res) {
    try {
        const file = await File.findOne({ where: { id: req.query.id } });
        const path = `${process.env.FILEPATH}/${file.path}/${file.name}`;

        if (file.type === 'dir') {
            const maxSize = Number(req.query.maxSize) || 2 * 1024 * 1024 * 1024;
            const partNumber = Number(req.query.part) || 1;

            // Собираем все файлы рекурсивно
            const allFiles = [];
            const collectFiles = async (parentId, relativePath) => {
                const children = await File.findAll({ where: { parent: parentId } });
                for (const child of children) {
                    if (child.type === 'dir') {
                        const newPath = relativePath
                            ? `${relativePath}/${child.name}`
                            : child.name;
                        await collectFiles(child.id, newPath);
                    } else {
                        allFiles.push({
                            name: child.name,
                            path: child.path,
                            size: Number(child.size),
                            relativePath,
                        });
                    }
                }
            };
            await collectFiles(file.id, '');

            // Делим на части по весу
            const parts = [];
            let currentPart = { sizeBytes: 0, files: [] };
            for (const f of allFiles) {
                if (
                    currentPart.sizeBytes + f.size > maxSize &&
                    currentPart.files.length > 0
                ) {
                    parts.push(currentPart);
                    currentPart = { sizeBytes: 0, files: [] };
                }
                currentPart.files.push(f);
                currentPart.sizeBytes += f.size;
            }
            if (currentPart.files.length > 0) parts.push(currentPart);

            // Берём нужную часть
            const targetPart = parts[partNumber - 1];
            if (!targetPart) {
                return res.status(400).json({ message: 'часть не найдена' });
            }

            // Собираем ZIP только для этой части
            const zip = new JSZip();
            for (const f of targetPart.files) {
                const fullPath = `${process.env.FILEPATH}/${f.path}/${f.name}`;
                const buffer = fs.readFileSync(fullPath);

                if (f.relativePath) {
                    const folder = zip.folder(f.relativePath);
                    folder.file(f.name, buffer);
                } else {
                    zip.file(f.name, buffer);
                }
            }

            await File.update({ isDownload: true }, { where: { id: file.id } });

            const content = await zip.generateAsync({ type: 'nodebuffer' });

            const downloadPath = `${process.env.FILEPATH}/download_${file.id}_part${partNumber}.zip`;
            fs.writeFileSync(downloadPath, content);

            // === СТРИМИМ ЧАНКАМИ ПО 64 КБ ===
            const stat = fs.statSync(downloadPath);

            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${encodeURIComponent(file.name)}_part${partNumber}.zip"`
            );

            // Важно: явно отключаем сжатие и буферизацию
            res.setHeader('Cache-Control', 'no-cache');

            const stream = fs.createReadStream(downloadPath, {
                highWaterMark: 64 * 1024, // 64 КБ — размер чанка
            });

            stream.on('error', (err) => {
                console.error('Ошибка стрима:', err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'ошибка чтения файла' });
                } else {
                    res.end();
                }
            });

            stream.pipe(res);
            return;
        } else {
            return res.download(path);
        }
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: 'ошибка скачивания' });
    }
}

    async getDownloadParts(req, res) {
        try {
            const file = await File.findOne({ where: { id: req.query.id } });
            const maxSize = Number(req.query.maxSize) || 2 * 1024 * 1024 * 1024; // 2 ГБ по умолчанию

            // Рекурсивно собираем все файлы с полными путями
            const allFiles = [];
            const collectFiles = async (parentId, relativePath) => {
                const children = await File.findAll({ where: { parent: parentId } });
                for (const child of children) {
                    if (child.type === 'dir') {
                        await collectFiles(child.id, `${relativePath}/${child.name}`);
                    } else {
                        allFiles.push({
                            id: child.id,
                            name: child.name,
                            path: child.path,
                            size: Number(child.size),
                            relativePath,
                        });
                    }
                }
            };
            await collectFiles(file.id, '');

            // Делим на части по весу
            const parts = [];
            let currentPart = { sizeBytes: 0, files: [] };

            for (const f of allFiles) {
                if (currentPart.sizeBytes + f.size > maxSize && currentPart.files.length > 0) {
                    parts.push(currentPart);
                    currentPart = { sizeBytes: 0, files: [] };
                }
                currentPart.files.push(f);
                currentPart.sizeBytes += f.size;
            }
            if (currentPart.files.length > 0) parts.push(currentPart);

            // Возвращаем структуру без самих файлов (только метаданные)
            return res.json({
                totalParts: parts.length,
                parts: parts.map((p, i) => ({
                    part: i + 1,
                    sizeBytes: p.sizeBytes,
                    fileCount: p.files.length,
                })),
            });
        } catch (error) {
            return res.status(400).json({ message: 'ошибка' });
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
            if (!file) {
            return res.status(404).json({ message: "Файл не найден" });
            }

            const filePath = path.join(process.env.FILEPATH, file.path, file.name);

            // Проверка существования файла
            if (!fs.existsSync(filePath)) {
            return res.status(200).json({ error: 'no file' });
            }

            if (file.type !== 'dir') {
            const contentType = mime.contentType(path.extname(filePath)) || 'application/octet-stream';
            res.contentType(contentType);

            // Проверка, что файл является изображением
            const mimeType = mime.lookup(filePath);
            if (mimeType && mimeType.startsWith('image/')) {
                try {
                const data = await sharp(filePath)
                    .resize(200)
                    .toBuffer();
                res.end(data);
                } catch (sharpError) {
                console.error('Sharp error:', sharpError);
                // Если sharp не смог обработать — отправляем оригинал
                res.sendFile(filePath);
                }
            } else {
                res.sendFile(filePath);
            }
            } else {
            res.status(400).json({ message: "Невозможно отобразить директорию" });
            }
        } catch (error) {
            console.error('displayFile error:', error);
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