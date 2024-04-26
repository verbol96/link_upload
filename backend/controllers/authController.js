const {User, Token, File, Order, LogUser} = require('../models/models')
const fileService = require('../services/fileService')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()
//const { Op } = require("sequelize");
const axios = require('axios')
const moment = require('moment-timezone');

class authController {

    async login(req, res, next){ 
        try {
            const {phone} = req.body
            let user = await User.findOne({where:{phone: phone}})
            if(!user) {
                user = await User.create({phone, FIO: '', adress: '', city: '', postCode:'', typePost: 'E'})
            }

            const accessToken = jwt.sign({ "id": user.id, "phone": user.phone}, process.env.ACCESS_KEY, {expiresIn: '24h'})
            const refreshToken = jwt.sign({ "id": user.id, "phone": user.phone}, process.env.REFRESH_KEY, {expiresIn: '240h'})
            
            if(phone !== '+375333258247' && phone !== '+375298832168' && phone !== '+375333509124') await Token.destroy({where: {userId: user.id}})
            
            await Token.create({refreshToken, userId: user.id})

            res.cookie('refreshToken', refreshToken, {maxAge: 10*24*60*60*1000, httpOnly: true})
            
            return res.json({user, accessToken} )
        } catch (error) {
            console.log(error)
        }
        
    }
    
    async refresh(req, res, next){
        try {
            const token = req.cookies.refreshToken
            const data = jwt.verify(token, process.env.REFRESH_KEY)
            const tokenDB = await Token.findOne({where: {refreshToken: token}})

            if(!data || ! tokenDB){
                return res.json('error_refresh')
            }

            const user = await User.findOne({where: {id: tokenDB.userId}})

            const accessToken = jwt.sign({ "id": user.id, "phone": user.phone}, process.env.ACCESS_KEY, {expiresIn: '24h'})
            const refreshToken = jwt.sign({ "id": user.id, "phone": user.phone}, process.env.REFRESH_KEY, {expiresIn: '240h'})
            
            await Token.update({refreshToken}, {where:{id: tokenDB.id}})
            res.cookie('refreshToken', refreshToken, {maxAge: 10*24*60*60*1000, httpOnly: true})
            return res.json({user, accessToken, refreshToken})
        } catch (error) {
            console.log(error)
            return res.status(500).json({error: error.message});
        }
        
    }
    async logout(req, res, next){
        try {
            const {refreshToken} = req.cookies
            const token = await Token.destroy({where: {refreshToken: refreshToken}})
            res.clearCookie('refreshToken')
            return res.json(token)
        } catch (error) {
            console.log(error)
        }
        
    }

    async getUsers(req, res) {
        try {
            const users = await User.findAll({
                include: [{
                    model: Order,
                    attributes: ['price'],
                }],
            });
    
            const usersWithOrderInfo = users.map(user => {
                const orderCount = user.orders.length;
                const totalOrderSum = user.orders.reduce((sum, order) => {
                    const price = Number(order.price);
                    return sum + (isNaN(price) ? 0 : price);
                }, 0);
    
                return {
                    id: user.id,
                    phone: user.phone,
                    FIO: user.FIO,
                    typePost: user.typePost,
                    city: user.city,
                    adress: user.adress,
                    postCode: user.postCode,
                    oblast: user.oblast,
                    raion: user.raion,
                    role: user.role,
                    createdAt: user.createdAt,
                    orderCount,
                    totalOrderSum: Number(totalOrderSum.toFixed(2))
                };
            });
            return res.json(usersWithOrderInfo);
        } catch (error) {
            console.log(error);
            return res.status(500).json({error: error.message});
        }
    }

    async passwordChange(req,res, next){
        try {
            const {oldPW, newPW} = req.body
            console.log({oldPW, newPW})
            const token = req.headers.authorization;
            const {phone} = jwt.verify(token.split(' ')[1], process.env.ACCESS_KEY)
            const user = await User.findOne({where:{phone:phone}})
           
            const isPassword = await bcryptjs.compare(oldPW, user.password)
            if(!isPassword) return res.json(0)

            const hashPassword = await bcryptjs.hash(newPW, 3)
            const data = await User.update({password: hashPassword}, {where: {id: user.id}})
          
            return res.json(data)
        } catch (error) {
            console.log(error)
        }
    }
 
    async dataChange(req,res, next){
        try {
            const {phone, FIO} = req.body
            const user = await User.findOne({where:{phone:phone}})

            const data = await User.update({ FIO: FIO}, {where: {id: user.id}})
          
            return res.json(data)
        } catch (error) {
            console.log(error)
        }
    }
    
    async changePasswordUser(req,res, next){
        try {
            const {phone, password} = req.body
            
            const hashPassword = await bcryptjs.hash(password, 3)
            const data = await User.update({password: hashPassword}, {where: {phone: phone}})
            return res.json(data)
        } catch (error) {
            console.log(error)
        }
    }

    async users_changeData(req,res, next){
        try {
            const {id, phone, FIO, typePost, city, adress, postCode, raion, oblast, role} = req.body
            const data = await User.update({phone, FIO, typePost, city, adress, postCode, raion, oblast, role}, {where: {id: id}})
            return res.json(data)
        } catch (error) {
            console.log(error)
            return res.status(500).json({error: error.message})
        }
    }
    async usersDelete(req, res, next){
        try {
            const { id } = req.params;
            const data = await User.destroy({where: {id: id}})
            return res.json(data)
        } catch (error) {
            console.log(error)
        }
    }
    async users_changePW(req,res, next){
        try {
            const {id, PW} = req.body
            
            const hashPassword = await bcryptjs.hash(PW, 3)
            const data = await User.update({password: hashPassword}, {where: {id: id}})
            return res.json(data)
        } catch (error) {
            console.log(error)
        }
    }

    async deleteUsersWithoutOrders(req, res, next) {
        try {
            // Найти всех пользователей и их заказы
            const users = await User.findAll({
                include: [{
                    model: Order,
                    attributes: ['id'],
                }],
            });
    
            // Отфильтровать пользователей, у которых нет заказов
            const usersWithoutOrders = users.filter(user => user.orders.length === 0);
    
            // Удалить каждого пользователя без заказов
            for (let user of usersWithoutOrders) {
                await User.destroy({ where: { id: user.id } });
            }
    
            // Вернуть количество удаленных пользователей
            return res.json({ deletedUsersCount: usersWithoutOrders.length });
        } catch (error) {
            console.log(error);
            return res.status(500).json({error: error.message});
        }
    }

    async whoAmI(req, res, next) {
        try {   
            const token = req.headers.authorization;
            if (!token) {
               return res.status(401).json({ message: 'No authorization token provided' })
            }
            const {phone} = jwt.verify(token.split(' ')[1], process.env.ACCESS_KEY)
            const user = await User.findOne({where: {phone: phone}})
            return res.json(user)
        } catch (error) {
            console.log(error)
            // Отправляем ответ с кодом ошибки и сообщением об ошибке
            return res.status(401).json({ message: 'Server error' })
        }   
    }

    async sendSms(req,res){
        const {phone, code} = req.body
        const response = await axios.post('https://app.sms.by/api/v1/sendQuickSMS', {
            token: process.env.TOKEN_SMS,
            alphaname_id: 4879,
            message: code.toString(), 
            phone: phone.replace(/[^0-9+]/g, '') 
        });
        return res.json(response.data)
    }

    async setLogUser(req, res){
        const {dataLog} = req.body
        await LogUser.create(dataLog)
        return res.json('ok')
    }

    async getLogUser(req, res){
        const data = await LogUser.findAll({})

        const moscowData = data.map(data => {
            const moscowTime = moment(data.createdAt).tz('Europe/Moscow'); // Преобразование в Московскую временную зону
            return {
              ...data.toJSON(),
              createdAt: moscowTime.format() // Форматирование даты и времени в строку
            };
          });

        return res.json(moscowData)
    }
}

module.exports = new authController()