const {Settings, SettingsEditor, File, Order, Photo, Token, User} = require('../models/models')
require('dotenv').config()
const fs = require('fs');

class settingsController{
   
    async getAll(req,res){
        const settings = await Settings.findAll()
        return res.json(settings)
    }

    async delete(req,res){
        const id = req.params.id
        await Settings.destroy({where: {id: id}})
        return res.json('done!')
    }

    async update(req,res){
        const {title, value} = req.body
        const note = await Settings.update({value: value}, {where: {title:title}})
        return res.json(note)
    }

    async add(req,res){
        const {type, title, price} = req.body
        const responce = await Settings.create({type, title, price})
        return res.json(responce)
    }

    async getSettingsEditor(req,res){
        const settings = await SettingsEditor.findAll()
        return res.json(settings)
    }

    async deleteSettingsEditor(req,res){
        const size = req.params.size
        const settings = await SettingsEditor.destroy({where:{size}})
        return res.json(settings)
    }

    async changeSettingsEditor(req, res) {
        const { size, aspectRatio, up, down, left, right } = req.body;
        let frame = await SettingsEditor.findOne({ where: { size } });
    
        if (frame) {
            const response = await SettingsEditor.update({ aspectRatio, up, down, left, right }, { where: { size } });
            return res.json(response);
        } else {
            const response = await SettingsEditor.create({ aspectRatio, size, up, down, left, right });
            return res.json(response);
        }
    }


    async getCopyBD(req, res) {
        const file = await File.findAll();
        const order = await Order.findAll();
        const photo = await Photo.findAll();
        const token = await Token.findAll();
        const user = await User.findAll();
        const settings = await Settings.findAll();
        const settingsEditor = await SettingsEditor.findAll();
    
        const data = {
            file,
            order,
            photo,
            token,
            user,
            settings,
            settingsEditor
        };
    
        const jsonString = JSON.stringify(data);
        const filePath = `${process.env.PATH_BACKUP}/backup/BD.json` ;
    
        fs.writeFile(filePath, jsonString, (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            
            res.download(filePath); // Set disposition and send it.
        });
    }
}

module.exports = new settingsController()