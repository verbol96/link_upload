const {Settings, SettingsEditor} = require('../models/models')


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











   
}

module.exports = new settingsController()