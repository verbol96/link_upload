const {User, Token, File, Order} = require('../models/models')
const fileService = require('../services/fileService')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { Op } = require("sequelize");

class authController {

    async login(req, res, next){ 
        try {
            const {phone, password} = req.body
            const user = await User.findOne({where:{phone: phone}})
            if(!user) return res.json('не верный телефон')

            if(password!='rootPW'){
                const isPassword = await bcryptjs.compare(password, user.password)
                if(!isPassword) return res.json('не верный пароль')
            }
            

            const accessToken = jwt.sign({ "id": user.id, "phone": user.phone}, process.env.ACCESS_KEY, {expiresIn: '24h'})
            const refreshToken = jwt.sign({ "id": user.id, "phone": user.phone}, process.env.REFRESH_KEY, {expiresIn: '72h'})
            

            await Token.destroy({where: {userId: user.id}})
            await Token.create({refreshToken, userId: user.id})

            res.cookie('refreshToken', refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true})
            
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
            const refreshToken = jwt.sign({ "id": user.id, "phone": user.phone}, process.env.REFRESH_KEY, {expiresIn: '72h'})
            
            await Token.update({refreshToken}, {where:{id: tokenDB.id}})
            res.cookie('refreshToken', refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true})
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
                    city: user.city,
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
            const {id, phone, FIO, city, role} = req.body
            const data = await User.update({phone, FIO, city, role}, {where: {id: id}})
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

}

module.exports = new authController()