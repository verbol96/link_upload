const fs = require('fs')
const {File} = require('../models/models')
require('dotenv').config()

class FileService {
    createdDir(name, path) {
        let baseFilePath;
        let baseName = name;
        if (path === undefined) baseFilePath = `${process.env.FILEPATH}/${name}`;
        else baseFilePath = `${process.env.FILEPATH}/${path}/${name}`;
    
        return new Promise((resolve, reject) => {
            try {
                let counter = 1;
                let filePath = baseFilePath;
                while (fs.existsSync(filePath)) {
                    baseName = `${name}(${counter})`;
                    filePath = `${baseFilePath}(${counter})`;
                    counter++;
                }
                fs.mkdirSync(filePath);
                return resolve({ message: `файл создан: ${filePath}`, path: filePath, name: baseName });
            } catch (error) {
                return reject({ message: 'ошибка файла' });
            }
        });
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