const { Expense } = require('../models/models');
const { Op } = require('sequelize');

// ============ ВАЛИДНЫЕ КАТЕГОРИИ ============
// ⚠️ Дублируем список с фронта — для защиты на бэке
const VALID_CATEGORIES = [
    // Производственные
    'photopaper', 'chemistry', 'water', 'ink', 'canvas',
    'plotter_paper', 'stretchers', 'photo_frames', 'packaging', 'other_materials',
    // Административные
    'shipping', 'taxes', 'rent', 'ads', 'site', 'salary', 'equipment', 'other_expenses',
];

// ============ ПРОИЗВОДСТВЕННЫЕ КАТЕГОРИИ ============
// Для расчёта "производственные vs административные"
const PRODUCTION_CATEGORIES = [
    'photopaper', 'chemistry', 'water', 'ink', 'canvas',
    'plotter_paper', 'stretchers', 'photo_frames', 'packaging', 'other_materials',
];

class ExpenseController {

    // ============ СПИСОК РАСХОДОВ ============
    async getAll(req, res) {
        try {
            const { from, to, category } = req.query;

            const where = {};

            // Фильтр по датам
            if (from || to) {
                where.createdAt = {};
                if (from) where.createdAt[Op.gte] = new Date(from);
                if (to) {
                    const toDate = new Date(to);
                    toDate.setHours(23, 59, 59, 999);
                    where.createdAt[Op.lte] = toDate;
                }
            }

            // Фильтр по категории
            if (category && category !== 'all') {
                where.category = category;
            }

            const expenses = await Expense.findAll({
                where,
                order: [['createdAt', 'DESC']],
            });

            return res.json(expenses);

        } catch (err) {
            console.error('getAll expenses error:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // ============ ДОБАВИТЬ РАСХОД ============
    async add(req, res) {
        try {
            const { category, amount, title } = req.body;

            // Проверка категории
            if (!VALID_CATEGORIES.includes(category)) {
                return res.status(400).json({ error: 'Неизвестная категория' });
            }

            // Проверка суммы
            if (amount === undefined || Number(amount) <= 0) {
                return res.status(400).json({ error: 'Сумма должна быть больше 0' });
            }

            const expense = await Expense.create({
                category,
                amount: Number(amount),
                title: title ? String(title).trim() : null,
            });

            return res.json(expense);

        } catch (err) {
            console.error('add expense error:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // ============ ОБНОВИТЬ РАСХОД ============
    async update(req, res) {
        try {
            const { id } = req.params;
            const { category, amount, title } = req.body;

            const expense = await Expense.findByPk(id);
            if (!expense) {
                return res.status(404).json({ error: 'Расход не найден' });
            }

            const updateData = {};

            if (category !== undefined) {
                if (!VALID_CATEGORIES.includes(category)) {
                    return res.status(400).json({ error: 'Неизвестная категория' });
                }
                updateData.category = category;
            }

            if (amount !== undefined) {
                if (Number(amount) <= 0) {
                    return res.status(400).json({ error: 'Сумма должна быть больше 0' });
                }
                updateData.amount = Number(amount);
            }

            if (title !== undefined) {
                updateData.title = title ? String(title).trim() : null;
            }

            await expense.update(updateData);

            return res.json(expense);

        } catch (err) {
            console.error('update expense error:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // ============ УДАЛИТЬ РАСХОД ============
    async delete(req, res) {
        try {
            const { id } = req.params;

            const expense = await Expense.findByPk(id);
            if (!expense) {
                return res.status(404).json({ error: 'Расход не найден' });
            }

            await expense.destroy();

            return res.json({ ok: true, id });

        } catch (err) {
            console.error('delete expense error:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // ============ СТАТИСТИКА ============
    async getStats(req, res) {
        try {
            const { from, to } = req.query;

            const where = {};
            if (from || to) {
                where.createdAt = {};
                if (from) where.createdAt[Op.gte] = new Date(from);
                if (to) {
                    const toDate = new Date(to);
                    toDate.setHours(23, 59, 59, 999);
                    where.createdAt[Op.lte] = toDate;
                }
            }

            const expenses = await Expense.findAll({ where });

            // Общая сумма
            const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

            // По категориям
            const byCategory = {};
            expenses.forEach(e => {
                byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
            });

            // Производственные vs административные
            const totalProduction = expenses
                .filter(e => PRODUCTION_CATEGORIES.includes(e.category))
                .reduce((sum, e) => sum + Number(e.amount), 0);

            const totalAdmin = total - totalProduction;

            return res.json({
                total: Number(total.toFixed(2)),
                totalProduction: Number(totalProduction.toFixed(2)),
                totalAdmin: Number(totalAdmin.toFixed(2)),
                count: expenses.length,
                byCategory: Object.entries(byCategory)
                    .map(([key, value]) => ({ key, value: Number(value.toFixed(2)) }))
                    .sort((a, b) => b.value - a.value),
            });

        } catch (err) {
            console.error('getStats error:', err);
            return res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new ExpenseController();