const fs = require('fs')
const {File} = require('../models/models')
require('dotenv').config()

class FileService {
    createdDir(file, path){
        const filePath = `${process.env.FILEPATH}/${path}/${file.name}`
        console.log(filePath)
        return new Promise((resolve, reject)=>{
            try {
                if(!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                    return resolve({message: 'файл создан'})
                } else{
                    return reject({message: 'файл уже существует'})
                }
            } catch (error) {
                return reject({message: 'ошибка файла'})
            }
        })
    }

    deleteFile(file){
        
        const path = `${process.env.FILEPATH}/${file.dataValues.path}/${file.dataValues.name}`
        console.log(`file: ${file.dataValues.path}`)
        console.log(`path: ${path}`)

        if(file.type==='dir')
            fs.rmdirSync(path)
        else 
            fs.unlinkSync(path)
    }
    
}

module.exports = new FileService()