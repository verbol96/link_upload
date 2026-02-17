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
        const settingsEditor = await SettingEditor.findAll();
        const logUsers = await LogUser.findAll()
    
        const data = {
            file,
            order,
            photo,
            token,
            user,
            settings,
            settingsEditor,
            logUsers
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
    async setCopyDB(req,res){

      const {file, order, photo, token, user, settings, settingsEditor, logUser} = req.body.file
      
      await Promise.all([
        User.destroy({ truncate: true, cascade: true }),
        Order.destroy({ truncate: true, cascade: true }),
        Photo.destroy({ truncate: true, cascade: true }),
        Settings.destroy({ truncate: true, cascade: true }),
        LogUser.destroy({ truncate: true, cascade: true }),
        SettingEditor.destroy({ truncate: true, cascade: true }),
        Token.destroy({ truncate: true, cascade: true }),
        File.destroy({ truncate: true, cascade: true }),
      ]);


       for (let i = 0; i < user.length; i++) {
        await User.create({
            id: user[i].id,
            phone: user[i].phone,
            FIO: user[i].FIO,
            password: user[i].password,
            role: user[i].role,
            typePost: user[i].typePost,
            postCode: user[i].postCode,
            city: user[i].city,
            adress: user[i].adress,
            oblast: user[i].oblast,
            raion: user[i].raion,
            createdAt: user[i].createdAt,
            updatedAt: user[i].updatedAt,
        });
      }
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
            firstClass: order[i].firstClass,
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
            userId: order[i].userId
        });
      }

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
              orderId: photo[i].orderId
          });
      }
            for (let i = 0; i < settings.length; i++) {
          await Settings.create({
              id: settings[i].id,
              type: settings[i].type,
              title: settings[i].title,
              price: settings[i].price,
              createdAt: settings[i].createdAt,
              updatedAt: settings[i].updatedAt,
          });
      }

            for(let i = 0; i < (logUser || []).length; i++){
        await LogUser.create({
          id: logUser[i].id,
          phone: logUser[i].phone,
          device: logUser[i].device,
          browser: logUser[i].browser,
          OS: logUser[i].OS,
          screen: logUser[i].screen,
          createdAt: logUser[i].createdAt,
          updatedAt: logUser[i].updatedAt,
        })
      }

            for (let i = 0; i < settingsEditor.length; i++) {
          await SettingsEditor.create({
              id: settingsEditor[i].id,
              size: settingsEditor[i].size,
              aspectRatio: settingsEditor[i].aspectRatio,
              up: settingsEditor[i].up,
              down: settingsEditor[i].down,
              left: settingsEditor[i].left,
              right: settingsEditor[i].right,
              createdAt: settingsEditor[i].createdAt,
              updatedAt: settingsEditor[i].updatedAt,
          });
      }

      for (let i = 0; i < token.length; i++) {
          await Token.create({
              id: token[i].id,
              refreshToken: token[i].refreshToken,
              createdAt: token[i].createdAt,
              updatedAt: token[i].updatedAt,
              userId: token[i].userId
          });
      }
     for (let i = 0; i < file.length; i++) {
          await File.create({
              id: file[i].id,
              name: file[i].name,
              type: file[i].type,
              size: file[i].size,
              path: file[i].path,
              parent: file[i].parent,
              createdAt: file[i].createdAt,
              updatedAt: file[i].updatedAt,
              photoId: file[i].photoId
          });
      }

      return res.json('everything is okey')
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