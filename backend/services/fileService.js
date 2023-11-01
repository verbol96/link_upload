const fs = require('fs');
const path = require('path');
const {File} = require('../models/models')
require('dotenv').config()
const rimraf = require('rimraf');

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

    
    // Функция для удаления всех файлов в директории
    deleteFolderContents(directory) {
        
        //rimraf('./few', function (err) { 
          //  console.log('1111')
            //if (err) throw err;
            
            // Директория удалена
          //});
    }
    
}

module.exports = new FileService()