const {User, Token, File, Order, LogUser, sequelize} = require('../models/models')
const { Op } = require("sequelize");
const fileService = require('../services/fileService')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const {recalculateUserStats} = require('../services/orderService')

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

    async getLogUser(req, res) {
    // Вычисляем дату месяц назад
    const oneMonthAgo = moment().subtract(1, 'month').tz('Europe/Moscow').toDate();
    
    const data = await LogUser.findAll({
        where: {
        createdAt: {
            [Op.gte]: oneMonthAgo // createdAt >= дата месяц назад
        }
        },
        order: [['createdAt', 'DESC']] // сортировка от новых к старым
    });

    const moscowData = data.map(item => {
        const moscowTime = moment(item.createdAt).tz('Europe/Moscow');
        return {
        ...item.toJSON(),
        createdAt: moscowTime.format()
        };
    });

    return res.json(moscowData);
    }

    async clients (req, res){
        const { 
            page,
            limit,
            search,
            sortBy,
            sortDir
        } = req.query;
        
        const offset = (page - 1) * limit;

        // Условия поиска
        const where = {};
        if (search) {
            where[Op.or] = [
                { FIO: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }

        const order = [];
        if (sortBy && sortDir) {
            order.push([sortBy, sortDir.toUpperCase()]);
        } else {
            order.push(['createdAt', 'DESC']); // сортировка по умолчанию
        }

        const { count, rows } = await User.findAndCountAll({
            where,                    // добавляем условие
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: { 
                exclude: ['oblast', 'raion', 'updatedAt'] // поля которые НЕ нужны
            },
            order
        });
        
        res.json({
            data: rows,
            total: count,
            page: parseInt(page),
            pageSize: parseInt(limit),
            totalPage: Math.ceil(count / limit)
        });
    };

    async clientUpdate(req,res)
    {
        try {
            const { id } = req.params;
            const { FIO, phone, role, typePost, postCode, city, adress } = req.body;

            const user = await User.findByPk(id);
            
            if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
            }

            await user.update({
                FIO,
                phone,
                role,
                typePost,
                postCode,
                city,
                adress
            });

            res.json({ message: 'Данные обновлены', user });
        } catch (error) {
            console.error('Ошибка обновления:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
    
    async updateUsers(req,res)
    {
        try {
           const users = await User.findAll({ attributes: ['id'] });
  
            for (const user of users) {
                await recalculateUserStats(user.id); // ← ваша функция
            }
            res.json({ message: 'Данные обновлены' });
        } catch (error) {
            console.error('Ошибка обновления:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    async clientsToLowerCase(req, res) {
        try {
            
            const users = await User.findAll();
            let updatedCount = 0;
            
            // Обновляем каждого
            for (let user of users) {
                // Проверка на пустое или null значение
                if (user.FIO && typeof user.FIO === 'string' && user.FIO.trim() !== '') {
                    await user.update({
                        FIO: user.FIO.toLowerCase().trim()
                    });
                    updatedCount++;
                } else {
                    console.log(`Пропущен пользователь ${user.id}: пустое поле FIO`);
                }
            }
            
            res.json({ 
                message: `Обновлено ${updatedCount} из ${users.length} пользователей` 
            });
            
        } catch (error) {
            console.error('Ошибка:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
}

module.exports = new authController()