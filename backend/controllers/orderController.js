const {User, Order, Adress, Photo, Status} = require('../models/models')


class orderController{
    async addOrder(req,res) {
        const {phone, name, nikname, typePost, firstClass, postCode, city, adress, oblast, raion, codeInside, codeOutside, price, other, photo} = req.body
        let user = await User.findOne({where: {phone: phone}})
        
        if(user===null){
            user = await User.create({phone, name, nikname})
        }
        
        const adressNew = await Adress.create({typePost, firstClass, postCode, city, adress, oblast, raion, userId: user.id})
        const order = await Order.create({codeInside, codeOutside, price, other, userId: user.id, adressId: adressNew.id, status: 1})
        await photo.map(el=>
            Photo.create({type: el.type, format: el.format, amount: el.amount, paper: el. paper, orderId: order.id }))

        await Status.create({step: 1, orderId: order.id})
        return res.json({order, user})
    }

    async getAll(req,res){
        const order = await Order.findAll()
        const user = await User.findAll()
        const photo = await Photo.findAll()
        const adress = await Adress.findAll()
        const status = await Status.findAll()
        return res.json({user, order, adress, photo, status})
    }

    async updateStatus(req,res){
        const id = req.params.id
        const {status} = req.body
        const order = await Order.update({status: status}, {where: {id:id}})
        return res.json(order)
    }

    async updateOrder(req,res){
        const id = req.params.id
        const {phone, name, nikname, typePost, firstClass, postCode, city, adress, oblast, raion, codeInside, codeOutside, price, other, photo, userId, adressId} = req.body

        await Order.update(
            {
                codeInside: codeInside, codeOutside: codeOutside, price: price, other: other
            },
            {where:{id: id}}
        )
       
        const user = await User.findOne({where: {phone: phone}})
        if(!user){
            await User.update(
                {
                    phone: phone, name: name, nikname: nikname
                },
                {where:{id: userId}}
            )}else{
                await Order.update(
                    {
                        userId: user.id
                    },
                    {where:{id: id}}
                )
                await User.update(
                    {
                        phone: phone, name: name, nikname: nikname
                    },
                    {where:{id: user.id}}
                )
            }

        await Adress.update(
            {
                typePost: typePost, firstClass: firstClass, postCode:postCode,city: city, adress:adress, oblast: oblast, raion: raion
            },
            {where:{id: adressId}}
        )

        await Photo.destroy({where: {orderId: id}})

        await photo.map(el=>
            Photo.create({type: el.type, format: el.format, amount: el.amount, paper: el. paper, orderId: id }))

        return res.json(id)
    }

    async deleteOrder(req,res){
        const id = req.params.id
        await Photo.destroy({where: {orderId: id}})
        await Status.destroy({where: {orderId: id}})
        const order = await Order.destroy({where: {id: id}})
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
        const {user, order, photo} = req.body

        await user.map(el=>{
            const {id, phone, name, nikname, typePost, firstClass, postCode, city, adress, oblas, raion, createdAt, updatedAt} = el
            const user1 =  User.create({id, phone, name, nikname, createdAt, updatedAt})
            
        })
        await user.map(el=>{
            const {id, phone, name, nikname, typePost, firstClass, postCode, city, adress, oblast, raion, createdAt, updatedAt} = el
            const adres =  Adress.create({id, typePost, firstClass, postCode, city, adress, oblast, raion, userId: id})
        })
        await order.map(el=>{
            const {id, codeInside, codeOutside, price, other, status, createdAt, updatedAt, userId} = el
            const order1 =  Order.create({id, codeInside, codeOutside, price, other, status, createdAt, updatedAt, userId, adressId: userId})
        })  
        await photo.map(el=>{
            const {id, type, format, amount, paper, createdAt, updatedAt, orderId} = el
            const photo =  Photo.create({id, type, format, amount, paper, createdAt, updatedAt, orderId})
        })  
        
        return res.json(user)
    }
}

module.exports = new orderController()