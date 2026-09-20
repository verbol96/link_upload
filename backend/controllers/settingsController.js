const {Settings, SettingEditor, File, Order, Photo, Token, User, LogUser} = require('../models/models')
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
        const {type, title, name, price} = req.body
        const responce = await Settings.create({type, title, name, price})
        return res.json(responce)
    }

        //сделать бэкап всех БД
    async getCopyBD(req, res) {
        const file = await File.findAll();
        const order = await Order.findAll();
        const photo = await Photo.findAll();
        const token = await Token.findAll();
        const user = await User.findAll();
        const settings = await Settings.findAll();
        const settingEditor = await SettingEditor.findAll();
    
        const data = {
            file,
            order,
            photo,
            token,
            user,
            settings,
            settingEditor
        };
    
        const jsonString = JSON.stringify(data);
        const filePath = `${process.env.PATH_BACKUP}/backup/DB.json` ;
    
        fs.writeFile(filePath, jsonString, (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            
            res.download(filePath); // Set disposition and send it.
        });
    }

        // очистить все БД и загрузить бэкап
    async setCopyDB(req, res) {
        const { file, order, photo, token, user, settings, settingEditor } = req.body.file;

        // ==========================================
        // 1. Удаление — ПОСЛЕДОВАТЕЛЬНО, от дочерних к родительским
        //    (важно для FK constraints)
        // ==========================================
        await File.destroy({ truncate: true, cascade: true });
        await Photo.destroy({ truncate: true, cascade: true });
        await Order.destroy({ truncate: true, cascade: true });
        await Token.destroy({ truncate: true, cascade: true });
        await LogUser.destroy({ truncate: true, cascade: true });
        await Settings.destroy({ truncate: true, cascade: true });
        await SettingEditor.destroy({ truncate: true, cascade: true });
        await User.destroy({ truncate: true, cascade: true });

        // ==========================================
        // 2. Восстановление — от родительских к дочерним
        // ==========================================

        // User
        for (let i = 0; i < user.length; i++) {
            await User.create({
                id: user[i].id,
                phone: user[i].phone,
                FIO: user[i].FIO,
                role: user[i].role,
                typePost: user[i].typePost,
                postCode: user[i].postCode,
                city: user[i].city,
                adress: user[i].adress,
                oblast: user[i].oblast,
                raion: user[i].raion,
                orderCount: user[i].orderCount || 0,
                totalOrderSum: user[i].totalOrderSum || 0,
                aboutUser: user[i].aboutUser,
                createdAt: user[i].createdAt,
                updatedAt: user[i].updatedAt,
            });
        }

        // Order
        for (let i = 0; i < order.length; i++) {
            await Order.create({
                id: order[i].id,
                order_number: order[i].order_number,
                codeOutside: order[i].codeOutside,
                price: order[i].price,
                other: order[i].other,
                notes: order[i].notes,
                status: order[i].status,
                typePost: order[i].typePost,
                postCode: order[i].postCode,
                city: order[i].city,
                adress: order[i].adress,
                oblast: order[i].oblast,
                raion: order[i].raion,
                FIO: order[i].FIO,
                phone: order[i].phone,
                price_deliver: order[i].price_deliver,
                main_dir_id: order[i].main_dir_id,
                origin: order[i].origin,
                is_sms_add: order[i].is_sms_add,
                is_sms_error: order[i].is_sms_error,
                is_sms_send: order[i].is_sms_send,
                is_sms_pay: order[i].is_sms_pay,
                date_sent: order[i].date_sent,
                createdAt: order[i].createdAt,
                updatedAt: order[i].updatedAt,
                userId: order[i].userId,
            });
        }

        // Photo
        for (let i = 0; i < photo.length; i++) {
            await Photo.create({
                id: photo[i].id,
                type: photo[i].type,
                format: photo[i].format,
                amount: photo[i].amount,
                paper: photo[i].paper,
                copies: photo[i].copies,
                createdAt: photo[i].createdAt,
                updatedAt: photo[i].updatedAt,
                orderId: photo[i].orderId,
            });
        }

        // Settings
        for (let i = 0; i < settings.length; i++) {
            await Settings.create({
                id: settings[i].id,
                type: settings[i].type,
                title: settings[i].title,
                name: settings[i].name,
                price: settings[i].price,
                createdAt: settings[i].createdAt,
                updatedAt: settings[i].updatedAt,
            });
        }

        // SettingEditor — ✅ добавлены widthList, heightList, isShow
        for (let i = 0; i < settingEditor.length; i++) {
            await SettingEditor.create({
                id: settingEditor[i].id,
                name: settingEditor[i].name,
                width: settingEditor[i].width,
                height: settingEditor[i].height,
                top: settingEditor[i].top,
                bottom: settingEditor[i].bottom,
                left: settingEditor[i].left,
                right: settingEditor[i].right,
                widthList: settingEditor[i].widthList,
                heightList: settingEditor[i].heightList,
                isShow: settingEditor[i].isShow,
                createdAt: settingEditor[i].createdAt,
                updatedAt: settingEditor[i].updatedAt,
            });
        }

        // Token
        for (let i = 0; i < token.length; i++) {
            await Token.create({
                id: token[i].id,
                refreshToken: token[i].refreshToken,
                createdAt: token[i].createdAt,
                updatedAt: token[i].updatedAt,
                userId: token[i].userId,
            });
        }

        // File — ✅ с try/catch на случай битого photoId
        for (let i = 0; i < file.length; i++) {
            try {
                await File.create({
                    id: file[i].id,
                    name: file[i].name,
                    type: file[i].type,
                    size: file[i].size,
                    path: file[i].path,
                    parent: file[i].parent,
                    createdAt: file[i].createdAt,
                    updatedAt: file[i].updatedAt,
                    photoId: file[i].photoId,
                    isDownload: file[i].isDownload,
                });
            } catch (err) {
                console.error(`Ошибка создания File ${file[i].id}:`, err.message);
            }
        }

        return res.json('everything is okey');
    }


    async getSettingEditor(req,res){
        const settings = await SettingEditor.findAll()
        return res.json(settings)
    }

    async deleteSettingEditor(req,res){
        const name = req.params.name
        const settings = await SettingEditor.destroy({where:{name}})
        return res.json(settings)
    }

    async changeSettingEditor(req, res) {
        const { name, width, height, top, bottom, left, right } = req.body;
        let frame = await SettingEditor.findOne({ where: { name } });
    
        if (frame) {
            const response = await SettingEditor.update({ width, height, top, bottom, left, right }, { where: { name } });
            return res.json(response);
        } else {
            const response = await SettingEditor.create({ name, width, height, top, bottom, left, right });
            return res.json(response);
        }
    }

    async saveFormat(req, res) {
        const { id, name, width, height, top, bottom, left, right, widthList, heightList, isShow } = req.body;

        if (id) {
            // Обновление
            await SettingEditor.update(
                { name, width, height, top, bottom, left, right, widthList, heightList, isShow },
                { where: { id } }
            );
            const updated = await SettingEditor.findByPk(id);
            return res.json(updated);
        } else {
            // Создание — БД сама поставит id
            const created = await SettingEditor.create({
                name, width, height, top, bottom, left, right, widthList, heightList, isShow
            });
            return res.json(created);
        }
    }

    async deleteFormat(req, res) {
        const id = req.params.id
        const settings = await SettingEditor.destroy({where:{id}})
        return res.json(settings)
    }
    

    async changePriceDel(req,res){
        const {title, price} = req.body
        await Settings.update(
            { price }, 
            { where: { title, type: 'deliver' } } 
        );
        return res.json('ok')
    }

}

module.exports = new settingsController()