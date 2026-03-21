const { User, Order } = require('../models/models');

async function recalculateUserStats(userId) {
  try {
    // Получаем все заказы пользователя
    const orders = await Order.findAll({
      where: { userId },
      attributes: ['price']
    });

    // Считаем количество и сумму
    const orderCount = orders.length;
    const orderSum = orders.reduce((sum, order) => {
      return sum += Number(order.price);
    }, 0);
        
    // Обновляем пользователя
    await User.update({
      orderCount,
      totalOrderSum: orderSum.toFixed(2)
    }, {
      where: { id: userId }
    });
    
    return;
  } catch (error) {
    console.error(`❌ Ошибка пересчета статистики для пользователя ${userId}:`, error);
    throw error;
  }
}

module.exports = {
  recalculateUserStats
};