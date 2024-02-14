const {User, Order, Photo, Settings} = require('../models/models')
const bcryptjs = require('bcryptjs')
const { Op, where } = require("sequelize");
const moment = require('moment-timezone');


class orderController{
    async addOrder(req,res) {
        const {phone, FIO, typePost, firstClass, postCode, city, adress,
             oblast, raion, codeOutside, price, other, notes, photo, auth, phoneUser, status, origin} = req.body

        let order
        if(auth){
            const user = await User.findOne({where: {phone: phoneUser}})
            order = await Order.create({codeOutside,price,other,notes, status, typePost,firstClass,
                postCode,city,adress,oblast,raion,FIO,phone,userId: user.id, origin
            })

            if(user.role === 'USER'){
              await User.update({FIO, typePost, postCode, city, adress },
                {where: 
                  {id: user.id}
                })
            }

        }else{
            const pretendent = await User.findOne({where: {phone: phone}})
            if(pretendent===null){
                const hashPassword = await bcryptjs.hash('rootPW', 3)
                const user = await User.create({phone, FIO, password: hashPassword, typePost, postCode,city,adress,oblast,raion})
                order = await Order.create({codeOutside,price,other,notes, status, typePost,firstClass,
                    postCode,city,adress,oblast,raion,FIO,phone,userId: user.id, origin
                })
            }else{
                order = await Order.create({codeOutside,price,other,notes, status, typePost,firstClass,
                    postCode,city,adress,oblast,raion,FIO,phone, userId: pretendent.id, origin
                })
            }
        }

        await Promise.all(photo.map(async el => {
          await Photo.create({id: el.id, type: el.type, format: el.format, amount: el.amount, copies: el.copies, paper: el.paper, orderId: order.id });
        }));

        let response = await Order.findOne({
          where: { id: order.id },
          include: [
            {
              model: User,
            },
            {
              model: Photo,
            },
          ],
        });
        
        if (response) {

          response =  {
            ...response.toJSON(),
            createdAt: moment(response.createdAt).tz('Europe/Moscow').format()
          }
        }
          
        return res.json(response)
    }

    async updateUserAdress(req,res){
        const id = req.params.id
        const {FIO, typePost, postCode, city, adress} = req.body
        const adressMain = await User.update({FIO, typePost, postCode, city, adress}
            ,{where: {id:id}})
        return res.json(adressMain)
    }

    async getAll(req,res){
        const orders = await Order.findAll({
            where: {
              createdAt: {
                [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth() - 2, new Date().getDate())
              }
            },
            include: [
              {
                model: User
              },
              {
                model: Photo
              }
            ]
          });
        const settings = await Settings.findAll()
        const users = await User.findAll({
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
          });

          const moscowOrders = orders.map(order => {
            const moscowTime = moment(order.createdAt).tz('Europe/Moscow'); // Преобразование в Московскую временную зону
            return {
              ...order.toJSON(),
              createdAt: moscowTime.format() // Форматирование даты и времени в строку
            };
          });
          
        return res.json({orders: moscowOrders, settings, users})
    }

    async getAllArchive(req,res){
        
        const orders = await Order.findAll({
            
            include: [
              {
                model: User
              },
              {
                model: Photo
              }
            ]
          });
        const settings = await Settings.findAll()
        const users = await User.findAll({
            attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'role'] }
          });

          const moscowOrders = orders.map(order => {
            const moscowTime = moment(order.createdAt).tz('Europe/Moscow'); // Преобразование в Московскую временную зону
            return {
              ...order.toJSON(),
              createdAt: moscowTime.format() // Форматирование даты и времени в строку
            };
          });

        return res.json({orders: moscowOrders, settings, users})
    }

    async getAllStat(req, res) {
        const orders = await Order.findAll({
          attributes: ['price', 'createdAt']
        });
      
        return res.json({orders});
      }

    async getOneUser(req,res){
        const {phone} = req.body
        const user = await User.findOne({
            where: {phone: phone},
            include: [
                {
                    model: Order,
                    include: [
                        {
                          model: Photo,
                        },
                      ],
                }
              ]
            })
            const order = await Order.findOne({where: {price_deliver: "0"}})
        return res.json({user, order})
    }

    async updateStatus(req,res){
        const id = req.params.id
        const {status} = req.body
        const order = await Order.update({status: status}, {where: {id:id}})
        return res.json(order)
    }

    async updateOrder(req,res){
        const id = req.params.id
        
        const {phone, FIO, typePost, firstClass, postCode, city, adress, oblast, raion,
           codeOutside, price, price_deliver, other, photo, userId, notes, phoneUser, main_dir_id, origin, is_sms_error, is_sms_add, is_sms_send, date_sent} = req.body

        const user = await User.findOne({where:{phone: phoneUser}})
        
        if(user){
            await Order.update(
                {
                    codeOutside, price, price_deliver, other, notes, userId, phone, FIO, typePost, firstClass, postCode ,city, adress, oblast, raion, userId: user.id, main_dir_id, origin, is_sms_error, is_sms_add, is_sms_send, date_sent
                },
                {where:{id: id}}
            )
        }else{
            const hashPassword = await bcryptjs.hash('1', 3)
            const user1 = await User.create({phone: phoneUser, FIO, password: hashPassword, typePost, postCode,city,adress,oblast,raion})

            await Order.update(
                {
                    codeOutside, price, price_deliver, other, notes, userId: user1.id, phone, FIO, typePost, firstClass, postCode ,city, adress, oblast, raion, main_dir_id, origin, is_sms_error, is_sms_add, is_sms_send, date_sent
                },
                {where:{id: id}}
            )
        }

        await Promise.all(photo.map(async el => {
          try{
            await Photo.update({type: el.type, format: el.format, amount: el.amount, copies: el.copies, paper: el.paper, orderId: id }, {where: {id: el.id}});

          }catch{
            await Photo.create({id: el.id, type: el.type, format: el.format, amount: el.amount, copies: el.copies, paper: el.paper, orderId: id });
          }
        }));


        return res.json(id)
    }

    async deleteOrder(req,res){
        const id = req.params.id
        const order = await Order.findOne({where: {id: id}})
        await Order.destroy({where: {id: id}})
        await Photo.destroy({where: {orderId: id}})
        return res.json(order)
    }

    async deleteUser(req,res){
        const id = req.params.id
        await Adress.destroy({where:{userId: id}})
        const user = await User.destroy({where: {id: id}})
        return res.json(user)
    }

    //для миграции БД
    async setCopyDB(req, res){
        const {user, adress, order, photo} = req.body
        const orders = order
        for (let i = 0; i < orders.length; i++) {
            const el = orders[i];
            const userEl = await user.find(user => user.id === el.userId);
            const adressEl = await adress.find(adress => adress.id === el.adressId);
            const photoEl = await photo.filter(photo => photo.orderId === el.id);

            let order;
            const pretendent = await User.findOne({where: {phone: userEl.phone.trim()}});
            if (pretendent === null) {
                const hashPassword = await bcryptjs.hash('1', 3);
                const user = await User.create({
                    phone: userEl.phone.trim(), 
                    FIO: userEl.name, 
                    password: hashPassword, 
                    typePost: adressEl.typePost, 
                    postCode: adressEl.postCode,
                    city: adressEl.city, 
                    adress: adressEl.adress, 
                    oblast: adressEl.oblast, 
                    raion: adressEl.raion
                });
                order = await Order.create({
                    codeOutside: el.codeOutside,
                    price: el.price,
                    other: el.other,
                    notes: userEl.nikname,
                    status: el.status,
                    typePost: adressEl.typePost,
                    firstClass: adressEl.firstClass,
                    postCode: adressEl.postCode,
                    city: adressEl.city,
                    adress: adressEl.adress,
                    oblast: adressEl.oblast,
                    raion: adressEl.raion,
                    phone: userEl.phone,
                    FIO: userEl.name,
                    userId: user.id,
                    createdAt: el.createdAt
                });
            } else {
                order = await Order.create({
                    codeOutside: el.codeOutside, 
                    price: el.price, 
                    other: el.other,
                    notes: userEl.nikname, 
                    status: el.status, 
                    typePost: adressEl.typePost,
                    firstClass: adressEl.firstClass,
                    postCode: adressEl.postCode,
                    city: adressEl.city,
                    adress: adressEl.adress,
                    oblast: adressEl.oblast,
                    raion: adressEl.raion, 
                    phone: userEl.phone,
                    FIO: userEl.name, 
                    userId: pretendent.id,
                    createdAt: el.createdAt
                });
            }
            await Promise.all(photoEl.map(el => Photo.create({
                type: el.type, 
                format: el.format, 
                amount: el.amount, 
                paper: el. paper,
                orderId: order.id 
            })));
        }
        
        return res.json(user)
    }

    //для изменения даты заказа
    async changeDataOrder(req,res){
      const id = req.params.id
      const {data} = req.body
      await Order.update({createdAt: data},
        {where: {id: id}})
      return res.json('')
  }
}

module.exports = new orderController()