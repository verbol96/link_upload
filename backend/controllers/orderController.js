const {User, Order, Photo, Settings, LogUser, SettingsEditor, Token, File} = require('../models/models')
const bcryptjs = require('bcryptjs')
const { Op, where } = require("sequelize");
const moment = require('moment-timezone');
const {recalculateUserStats} = require('../services/orderService')
const fs = require('fs/promises');
const path = require('path');
const { sequelize } = require('../models/models');

//для объединения заказов
const pathExists = async (p) => {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
};

class orderController{

    async addOrder(req,res) {
        const {phone, FIO, typePost, firstClass, postCode, city, adress,
             oblast, raion, codeOutside, price, price_deliver, other, notes, photo, auth, phoneUser, status, origin} = req.body

        // === Расчёт даты отправки ===
        const dateSent = new Date();
        dateSent.setHours(0, 0, 0, 0);
        dateSent.setDate(dateSent.getDate() + 2);   // +2 дня от сегодня

        // Если попали на воскресенье — сдвигаем ВПЕРЁД
        if (dateSent.getDay() === 0) {
            const isEuropePost = typePost === 'E' || typePost === 'E1';
            // E/E1 → вторник (+2), остальные → понедельник (+1)
            dateSent.setDate(dateSent.getDate() + (isEuropePost ? 2 : 1));
        }
        // Если попали на субботу — сдвигаем НАЗАД на пятницу
        else if (dateSent.getDay() === 6) {
            dateSent.setDate(dateSent.getDate() - 1);   // −1 день → пятница
        }

        let order
        if(auth){
            const user = await User.findOne({where: {phone: phoneUser}})
            order = await Order.create({codeOutside,price,price_deliver,other,notes, status, typePost,firstClass,
                postCode,city,adress,oblast,raion,FIO,phone,userId: user.id, origin, date_sent: dateSent
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
                
                const user = await User.create({phone, FIO, typePost, postCode,city,adress,oblast,raion})
                order = await Order.create({codeOutside,price,price_deliver,other,notes, status, typePost,firstClass,
                    postCode,city,adress,oblast,raion,FIO,phone,userId: user.id, origin, date_sent: dateSent
                })
            }else{
                order = await Order.create({codeOutside,price,price_deliver,other,notes, status, typePost,firstClass,
                    postCode,city,adress,oblast,raion,FIO,phone, userId: pretendent.id, origin, date_sent: dateSent
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

        await recalculateUserStats(response.userId)
          
        return res.json(response)
    }

    async updateUserAdress(req,res){
       const id = req.params.id;
      const { FIO, typePost, postCode, city, adress } = req.body;

      await User.update(
          { FIO, typePost, postCode, city, adress },
          { where: { id } }
      );

      const updatedUser = await User.findByPk(id);
      return res.json(updatedUser.dataValues);
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
                model: User,
                attributes: ['id', 'FIO', 'phone', 'orderCount', 'totalOrderSum', 'aboutUser', 'role'] 
              },
              {
                model: Photo
              }
            ] 
          });
        const settings = await Settings.findAll()
        const users = await User.findAll({
          attributes: ['id', 'FIO', 'phone', 'role', 'orderCount', 'aboutUser']
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

    async getAllNewStart(req,res){
       
        const settings = await Settings.findAll()
        const users = await User.findAll({
          attributes: ['id', 'FIO', 'phone', 'role', 'city']
        });
          
        return res.json({settings, users})
    }

    async getAllNew(req,res){
        const orders = await Order.findAll({
            where: {
              status: [1,2,3,4]
            },
            include: [
              {
                model: User,
                attributes: ['id', 'FIO', 'phone', 'orderCount'] 
              },
              {
                model: Photo
              }
            ]
          });

          
        return res.json(orders)
    }

   async getAllArchive(req, res) {
      const {startArchive, endArchive} = req.query
      const now = moment().tz('Europe/Moscow');
      const startDate = now.clone().subtract(startArchive, 'months').startOf('month');
      const endDate = now.clone().subtract(endArchive, 'months').endOf('month');

      const orders = await Order.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate.toDate(), endDate.toDate()]
          }
        },
        include: [
          { model: User },
          { model: Photo }
        ]
      });

      const settings = await Settings.findAll();
      const users = await User.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      });

      const moscowOrders = orders.map(order => {
        const moscowTime = moment(order.createdAt).tz('Europe/Moscow');
        return {
          ...order.toJSON(),
          createdAt: moscowTime.format()
        };
      });

      return res.json({ orders: moscowOrders, settings, users });
    }

    async getAllStat(req, res) {
        const orders = await Order.findAll({
          attributes: ['price', 'createdAt', 'phone', 'origin']
        });
      
        return res.json({orders});
      }
 
    async getOneUser(req,res){
        const {phone} = req.body
        const user = await User.findOne({
            where: { phone: phone },
            attributes: {exclude: ['aboutUser']},
            include: [
                {
                    model: Order,
                    attributes: { 
                        exclude: ['notes'] // Исключаем только notes
                    },
                    include: [
                        {
                            model: Photo,
                        },
                    ], 
                }
            ]
        });

            const moscowOrders = user.orders.map(order => {
              const moscowTime = moment(order.createdAt).tz('Europe/Moscow'); // Преобразование в Московскую временную зону
              return {
                ...order.toJSON(),
                createdAt: moscowTime.format() // Форматирование даты и времени в строку
              };
            });

        return res.json({user, orders: moscowOrders})
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
           codeOutside, price, price_deliver, other, photo, userId, notes, phoneUser, main_dir_id, origin, is_sms_error, is_sms_add, is_sms_send, is_sms_pay, date_sent, isPayment} = req.body

           
        const user = await User.findOne({where:{phone: phoneUser}})
        let user1 ={}
        if(user){
            await Order.update(
                {
                    codeOutside, price, price_deliver, other, notes, userId, phone, FIO, typePost, firstClass, postCode ,city, adress, oblast, raion, userId: user.id, main_dir_id, origin, is_sms_error, is_sms_add, is_sms_send, is_sms_pay, date_sent, isPayment
                },
                {where:{id: id}}
            )
        }else{
             user1 = await User.create({phone: phoneUser, FIO, typePost, postCode,city,adress,oblast,raion})

            await Order.update(
                {
                    codeOutside, price, price_deliver, other, notes, userId: user1.id, phone, FIO, typePost, firstClass, postCode ,city, adress, oblast, raion, main_dir_id, origin, is_sms_error, is_sms_add, is_sms_send, is_sms_pay, date_sent, isPayment
                },
                {where:{id: id}}
            )
        }

        let photoBD = await Photo.findAll({ where: { orderId: id } });

        await Promise.all(photo.map(async el => {
          try {
            // Выполняем обновление записи
            const [affectedRows] = await Photo.update(
              { type: el.type, format: el.format, amount: el.amount, copies: el.copies, paper: el.paper, orderId: id },
              { where: { id: el.id } }
            );
        
            if (affectedRows > 0) {
              // Если запись была обновлена, удаляем ее из массива `photoBD`
              photoBD = photoBD.filter(photo => photo.id !== el.id);
            } else {
              // Если запись не была найдена для обновления, создаем новую
              await Photo.create({
                id: el.id,
                type: el.type,
                format: el.format,
                amount: el.amount,
                copies: el.copies,
                paper: el.paper,
                orderId: id
              });
            }
          } catch (error) {
            // В случае ошибки при обновлении создаем новую запись
            await Photo.create({
              id: el.id,
              type: el.type,
              format: el.format,
              amount: el.amount,
              copies: el.copies,
              paper: el.paper,
              orderId: id
            });
          }
        }));
        
        // Удаляем оставшиеся записи, которые не были обновлены или найдены в новом массиве
        await Promise.all(photoBD.map(photo => photo.destroy()));
        await recalculateUserStats(user ? user.id : user1.id)

        return res.json(id)
    }

    
    async toJoinOrder(req, res) {
        const { id, idJoin, other, price } = req.body;
        const FILEPATH = process.env.FILEPATH;

        try {
            await sequelize.transaction(async (t) => {

                // 1. Обновляем other
                await Order.update(
                    { other, price },
                    { where: { id }, transaction: t }
                );

                // 2. Заказы и их папки
                const mainOrder = await Order.findByPk(id, { transaction: t });
                const joinOrder = await Order.findByPk(idJoin, { transaction: t });

                const mainDir = await File.findByPk(mainOrder.main_dir_id, { transaction: t });
                const joinDir = await File.findByPk(joinOrder.main_dir_id, { transaction: t });

                // 3. Все подпапки второго заказа
                const joinSubdirs = await File.findAll({
                    where: { parent: joinDir.id, type: 'dir' },
                    transaction: t,
                });

                const physicalMainDir = path.join(FILEPATH, mainDir.name);
                const physicalJoinDir = path.join(FILEPATH, joinDir.name);

                // 4. Переносим каждую подпапку
                for (const subdir of joinSubdirs) {

                    // 4.1 Новое имя с префиксом + проверка коллизий
                    let newSubdirName = `${subdir.name}_${joinOrder.order_number}`;
                    let counter = 1;

                    // Проверяем коллизии и по диску, и по БД
                    while (
                        await pathExists(path.join(physicalMainDir, newSubdirName)) ||
                        await File.findOne({
                            where: { parent: mainDir.id, name: newSubdirName },
                            transaction: t,
                        })
                    ) {
                        newSubdirName = `${joinOrder.order_number}_${subdir.name}(${counter})`;
                        counter++;
                    }

                    // 4.2 Физически перемещаем папку
                    const physicalOldPath = path.join(physicalJoinDir, subdir.name);
                    const physicalNewPath = path.join(physicalMainDir, newSubdirName);

                    await fs.rename(physicalOldPath, physicalNewPath);

                    // 4.3 Обновляем саму подпапку
                    await subdir.update({
                        name: newSubdirName,
                        parent: mainDir.id,
                        path: mainDir.name,
                    }, { transaction: t });

                    // 4.4 Обновляем path у файлов внутри (parent НЕ трогаем)
                    await File.update(
                        { path: `${mainDir.name}/${newSubdirName}` },
                        { where: { parent: subdir.id }, transaction: t }
                    );
                }

                // 5. Удаляем папку второго заказа, если пуста
                const remaining = await File.findAll({
                    where: { parent: joinDir.id },
                    transaction: t,
                });

                if (remaining.length === 0) {
                    try {
                        await fs.rm(physicalJoinDir, { recursive: true, force: true });
                    } catch (e) {
                        console.warn('Не удалить папку заказа:', e.message);
                    }
                    await joinDir.destroy({ transaction: t });
                } else {
                    console.warn(
                        `⚠️ В папке заказа ${joinOrder.order_number} осталось:`,
                        remaining.map(f => f.name)
                    );
                }

                // 6. Перепривязываем фото
                await Photo.update(
                    { orderId: id },
                    { where: { orderId: idJoin }, transaction: t }
                );

                // 7. Удаляем второй заказ
                await Order.destroy({ where: { id: idJoin }, transaction: t });
            });

            // 8. Пересчёт статистики
            const mainOrder = await Order.findByPk(id);
            if (mainOrder) await recalculateUserStats(mainOrder.userId);

            // 9. Возвращаем обновлённый заказ
            const updatedOrder = await Order.findByPk(id, { include: [Photo] });
            return res.json(updatedOrder);

        } catch (err) {
            console.error('toJoinOrder error:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    async deleteOrder(req,res){
        const id = req.params.id
        const order = await Order.findOne({where: {id: id}})
        await Order.destroy({where: {id: id}})
        await Photo.destroy({where: {orderId: id}})
        //await recalculateUserStats(order.userId)
        return res.json(order)
    }

    async deleteUser(req,res){
        const id = req.params.id
        await Adress.destroy({where:{userId: id}})
        const user = await User.destroy({where: {id: id}})
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

    async ordersUser(req, res) {
      const id = req.params.id;
      const orders = await Order.findAll({
        where: { userId: id },
        include: [{ model: Photo }],
        order: [['createdAt', 'DESC']]  // сортировка по дате, новые сверху
      });
      return res.json(orders);
    }


    async changeAboutUser(req, res) {
      try {
        
        const id = req.params.id;
        const {aboutUser}  = req.body;
        const [updated] = await User.update(
          { aboutUser },
          { where: { id: id } }
        );

        if (updated === 0) {
          return res.status(404).json({ error: 'Пользователь не найден' });
        }

        return res.json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    async getMaterialStats(req, res) {
        try {
            const { months, from, to, startMonth, count } = req.query;

            let dateFilter = null;
            let endFilter = null;

            // ===== Приоритет 1: startMonth + count =====
            if (startMonth && count && count !== 'all') {
                const [y, m] = startMonth.split('-').map(Number);
                const countNum = Number(count);

                dateFilter = new Date(y, m - 1, 1);                 // 1-е число выбранного месяца
                endFilter = new Date(y, m - 1 + countNum, 0);        // последний день последнего месяца
                endFilter.setHours(23, 59, 59, 999);
            }
            // ===== Приоритет 2: startMonth без count (или all) =====
            else if (startMonth && (!count || count === 'all')) {
                const [y, m] = startMonth.split('-').map(Number);
                dateFilter = new Date(y, m - 1, 1);
                // без верхней границы — до сегодня
            }
            // ===== Приоритет 3: from / to =====
            else if (from) {
                dateFilter = new Date(from);
                if (to) {
                    endFilter = new Date(to);
                    endFilter.setHours(23, 59, 59, 999);
                }
            }
            // ===== Приоритет 4: months (легаси-пресеты) =====
            else if (months && months !== 'all') {
                const monthsNum = Number(months);
                if (!isNaN(monthsNum) && monthsNum > 0) {
                    dateFilter = new Date();
                    dateFilter.setMonth(dateFilter.getMonth() - monthsNum);
                }
            }

            // ===== УСЛОВИЕ ДЛЯ ORDER =====
            const orderWhere = {};
            if (dateFilter) {
                orderWhere.createdAt = { [Op.gte]: dateFilter };
            }
            if (endFilter) {
                orderWhere.createdAt = {
                    ...(orderWhere.createdAt || {}),
                    [Op.lte]: endFilter,
                };
            }

            // ===== ПРАЙС-ЛИСТ =====
            const settings = await Settings.findAll();
            const priceMap = {};
            settings.forEach(s => {
                priceMap[s.title] = Number(s.price) || 0;
            });

            // ===== PHOTO + ORDER =====
            const photos = await Photo.findAll({
                include: [{
                    model: Order,
                    where: orderWhere,
                    attributes: ['id', 'createdAt', 'status'],
                    required: true,
                }],
            });

            // ===== ПОДСЧЁТ =====
            const stats = {
                totalPhotos: photos.length,
                totalAmount: 0,
                totalRevenue: 0,
                byFormat: {}, byFormatRevenue: {},
                byPaper: {}, byPaperRevenue: {},
                byType: {}, byTypeRevenue: {},
                byFormatPaper: {}, byFormatPaperRevenue: {},
            };

            photos.forEach(photo => {
                const qty = Number(photo.amount || 0) * Number(photo.copies || 1);
                const price = priceMap[photo.format] || 0;
                const revenue = qty * price;

                stats.totalAmount += qty;
                stats.totalRevenue += revenue;

                const fmt = photo.format || 'неизвестно';
                const paper = photo.paper || 'неизвестно';
                const type = photo.type || 'неизвестно';
                const fpKey = `${fmt}_${paper}`;

                stats.byFormat[fmt] = (stats.byFormat[fmt] || 0) + qty;
                stats.byPaper[paper] = (stats.byPaper[paper] || 0) + qty;
                stats.byType[type] = (stats.byType[type] || 0) + qty;
                stats.byFormatPaper[fpKey] = (stats.byFormatPaper[fpKey] || 0) + qty;

                stats.byFormatRevenue[fmt] = (stats.byFormatRevenue[fmt] || 0) + revenue;
                stats.byPaperRevenue[paper] = (stats.byPaperRevenue[paper] || 0) + revenue;
                stats.byTypeRevenue[type] = (stats.byTypeRevenue[type] || 0) + revenue;
                stats.byFormatPaperRevenue[fpKey] = (stats.byFormatPaperRevenue[fpKey] || 0) + revenue;
            });

            const toSortedArray = (obj) =>
                Object.entries(obj)
                    .map(([key, value]) => ({ key, value: Number(value.toFixed(2)) }))
                    .sort((a, b) => b.value - a.value);

            return res.json({
                period: {
                    from: dateFilter,
                    to: endFilter || new Date(),
                    months: count || (startMonth ? 'custom' : 'all'),
                },
                totalPhotos: stats.totalPhotos,
                totalAmount: stats.totalAmount,
                totalRevenue: Number(stats.totalRevenue.toFixed(2)),

                byFormat: toSortedArray(stats.byFormat),
                byPaper: toSortedArray(stats.byPaper),
                byType: toSortedArray(stats.byType),
                byFormatPaper: toSortedArray(stats.byFormatPaper),

                byFormatRevenue: toSortedArray(stats.byFormatRevenue),
                byPaperRevenue: toSortedArray(stats.byPaperRevenue),
                byTypeRevenue: toSortedArray(stats.byTypeRevenue),
                byFormatPaperRevenue: toSortedArray(stats.byFormatPaperRevenue),
            });

        } catch (err) {
            console.error('getMaterialStats error:', err);
            return res.status(500).json({ error: err.message });
        }
    }
    
  
}

module.exports = new orderController()