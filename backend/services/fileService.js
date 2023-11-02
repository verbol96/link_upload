const fs = require('fs');
const path = require('path');
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

        if(file.type==='dir')
            fs.rmdirSync(path)
        else 
            fs.unlinkSync(path)
    }

    
    // Функция для удаления всех файлов в директории
    deleteFolderContents(directory) {
        try {
            fs.rmSync(process.env.FILEPATH, { recursive: true, force: true });
            fs.mkdirSync(process.env.FILEPATH);
          } catch (err) {
            console.error('Error while removing directory:', err);
          }
    }
    
}

module.exports = new FileService()