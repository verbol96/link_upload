const {Settings} = require('../models/models')


class settingsController{
   
    async getAll(req,res){
        const settings = await Settings.findAll()
        return res.json(settings)
    }

    async delete(req,res){
        const value = req.params.id
        await Settings.destroy({where: {title: value}})
        return res.json('done!')
    }

    async update(req,res){
        const {title, value} = req.body
        const note = await Settings.update({value: value}, {where: {title:title}})
        return res.json(note)
    }

    async add(req,res){
        const {title, value} = req.body
        const note = await Settings.create({title: title, value: value})
        return res.json(note)
    }









   
}

module.exports = new settingsController()