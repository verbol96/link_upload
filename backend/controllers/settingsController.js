const {
    User,
    Order,
    Photo,
    Settings,
    Token,
    File,
    SettingEditor,
    LogUser,
    Expense,
    MyFileDraft,
    MyFileFolder,
    MyFileItem,
    sequelize
} = require('../models/models');

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

    // Сделать бэкап всех таблиц
    async getCopyBD(req, res) {
        try {
            const models = {
                file: File,
                order: Order,
                photo: Photo,
                token: Token,
                user: User,
                settings: Settings,
                settingEditor: SettingEditor,
                expense: Expense,
                logUser: LogUser,
                myFileDraft: MyFileDraft,
                myFileFolder: MyFileFolder,
                myFileItem: MyFileItem
            };

            const data = await sequelize.transaction(
                { isolationLevel: 'REPEATABLE READ' },
                async (transaction) => {
                    const result = {};

                    for (const [key, model] of Object.entries(models)) {
                        result[key] = await model.findAll({
                            raw: true,
                            transaction
                        });
                    }

                    return result;
                }
            );

            const jsonString = JSON.stringify(data);
            const backupDir = `${process.env.PATH_BACKUP}/backup`;
            const filePath = `${backupDir}/DB.json`;

            await fs.promises.mkdir(backupDir, { recursive: true });
            await fs.promises.writeFile(filePath, jsonString);

            return res.download(filePath);

        } catch (error) {
            console.error('Ошибка создания бэкапа:', error);

            return res.status(500).json({
                message: 'Ошибка создания бэкапа'
            });
        }
    }
        
    // Очистить все таблицы и восстановить бэкап
    async setCopyDB(req, res) {
        try {
            const data = req.body.file;

            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                return res.status(400).json({
                    message: 'Некорректный файл бэкапа'
                });
            }

            // Порядок восстановления:
            // от родительских таблиц к дочерним
            const models = [
                ['user', User],
                ['order', Order],
                ['photo', Photo],
                ['file', File],
                ['token', Token],
                ['settings', Settings],
                ['settingEditor', SettingEditor],
                ['expense', Expense],
                ['logUser', LogUser],
                ['myFileDraft', MyFileDraft],
                ['myFileFolder', MyFileFolder],
                ['myFileItem', MyFileItem]
            ];

            // Проверка обязательных таблиц
            const required = [
                'user',
                'order',
                'photo',
                'file',
                'token',
                'settings',
                'settingEditor',
                'expense',
                'logUser'
            ];

            for (const key of required) {
                if (!Array.isArray(data[key])) {
                    return res.status(400).json({
                        message: `В бэкапе отсутствует таблица ${key}`
                    });
                }
            }

            // Проверка формата всех переданных таблиц
            for (const [key] of models) {
                if (data[key] !== undefined && !Array.isArray(data[key])) {
                    return res.status(400).json({
                        message: `Некорректные данные таблицы ${key}`
                    });
                }
            }

            await sequelize.transaction(async (transaction) => {

                // 1. Очистка таблиц
                // От дочерних к родительским
                for (const [, model] of [...models].reverse()) {
                    await model.destroy({
                        where: {},
                        transaction
                    });
                }

                // 2. Восстановление таблиц
                // От родительских к дочерним
                for (const [key, model] of models) {
                    const rows = data[key] || [];

                    if (!rows.length) continue;

                    // Восстанавливаем порциями по 1000 записей
                    for (let i = 0; i < rows.length; i += 1000) {
                        await model.bulkCreate(
                            rows.slice(i, i + 1000),
                            {
                                transaction,
                                validate: true
                            }
                        );
                    }
                }

                // 3. Восстановление счётчика номеров заказов
                await sequelize.query(`
                    SELECT setval(
                        pg_get_serial_sequence('"orders"', 'order_number'),
                        COALESCE(MAX("order_number"), 1),
                        MAX("order_number") IS NOT NULL
                    )
                    FROM "orders";
                `, { transaction });
            });

            return res.json('everything is okey');

        } catch (error) {
            console.error('Ошибка восстановления БД:', error);

            return res.status(500).json({
                message: 'Ошибка восстановления БД'
            });
        }
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