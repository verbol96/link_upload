const axios = require('axios');
const {Order} = require('../models/models')
const { Sequelize } = require('sequelize');
require('dotenv').config()

const epApi = axios.create({
    baseURL: 'https://api-kassa.evropochta.by',
    headers: {
        Token: process.env.TOKEN_EP
    },
    timeout: 15000
});

class euroPostController {

  getListOps = async (req, res) => {
      try {
          const { data } = await epApi.get('/api/external/stores');
          return res.json(data);
      } catch (error) {
          return res.status(502).json({
              error: 'Ошибка получения списка отделений'
          });
      }
  }

  sendOrder = async (req, res) => {
      const { sum, OPS, phone, name1, name2 } = req.body;

      const payload = {
          delivery_type: 1,
          weight: 0.5,
          is_auto_delivery: false,

          payment_amount: Number(sum),
          declared_amount: Number(sum),

          packing_payer: 0,
          shipment_payer: 1,
          cash_on_delivery_payer: 1,

          store_id_start: 40130050,
          store_id_finish: Number(OPS),

          receiver_phone_number: String(phone).replace(/\D/g, ''),
          receiver_surname: name1,
          receiver_name: name2
      };

      try {
          const { data } = await epApi.post(
              '/api/external/postal/create',
              payload
          );

          return res.json(data);
      } catch (error) {
          console.error('Ошибка создания ПчО:', error.response?.data || error.message);

          return res.status(error.response?.status || 502).json({
              message: error.response?.data?.message || error.message
          });
      }
  }

  getOrderHistory = async (req, res) => {
    const { number } = req.query;

    if (typeof number !== 'string' || !number.trim()) {
        return res.status(400).json({
            message: 'Необходимо передать трек-номер'
        });
    }

    try {
        const { data } = await epApi.get(
            '/api/external/postal/history',
            {
                params: { number: number.trim() }
            }
        );

        return res.json(data);
    } catch (error) {
        return res.status(error.response?.status || 502).json({
            message: error.response?.data?.message ||
                'Ошибка получения истории отправления',
            details: error.response?.data || error.message
        });
    }
  }

  checkOrder = async (req, res) => {
      const { number } = req.body;

      try {
          const { data } = await epApi.get(
              `/api/external/postal/${encodeURIComponent(number)}`
          );

          return res.json(data);
      } catch (error) {
          return res.status(error.response?.status || 502).json({
              error: 'Ошибка получения отправления',
              details: error.response?.data || error.message
          });
      }
  }

  changeStatusEP = async (req, res) => {
    const { list } = req.body;

    if (!Array.isArray(list)) {
      return res.status(400).json({ error: 'List must be an array' });
    }

    try {
      for (const item of list) {
        await Order.update(
          { status: 6 }, 
          { where: { codeOutside: item } } 
        );
      }

      return res.status(200).json('ok');
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      return res.status(500).json({ error: 'Ошибка обновления статуса' });
    }
  };

  getLabel = async (req, res) => {
    const { number } = req.params;

    try {
        const { data } = await epApi.get(
            `/api/external/label/thermal/${encodeURIComponent(number)}`,
            {
                responseType: 'arraybuffer',
                headers: {
                    Accept: 'application/pdf'
                }
            }
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=label.pdf');
        return res.send(Buffer.from(data));

    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: 'Ошибка получения ярлыка'
        });
    }
};



  // Функция для получения списка счетов
  getInvoicesPay = async (req, res) => {
    const {No} = req.body
    const token = process.env.TOKEN_PAY;
    const url1 =  `https://api.express-pay.by/v1/invoices/`;
      // Выполняем GET-запрос с токеном в URL
      const { data } = await axios.get(url1, {
          params: {
              token: token,
              AccountNo: No
          }
      });

    if(data.Items.length === 0 || !data) return res.status(404).json({ error: 'not found' });


    // Формируем URL в зависимости от окружения
    const url =  `https://api.express-pay.by/v1/invoices/${data.Items[data.Items.length-1].InvoiceNo}/status`

    try {
        // Выполняем GET-запрос с токеном в URL
        const { data } = await axios.get(url, {
            params: {
                token: token
            }
        });

        // Отправляем данные в формате JSON
        return res.json(data);
    } catch (error) {
        // Обработка ошибок
        console.error('Ошибка при выполнении запроса:', error.response ? error.response.data : error.message);
        return res.status(500).json({ error: 'Ошибка при выполнении запроса', details: error.message });
    }
};

addInvoicesPay = async (req, res) => {
    const { AccountNo, Amount, Info } = req.body;
    const token = process.env.TOKEN_PAY;
    const isTest = false;

    const url = isTest
        ? `https://sandbox-api.express-pay.by/v1/invoices/`
        : `https://api.express-pay.by/v1/invoices/`;

    const dataInvoices = {
        AccountNo,
        Amount,
        Currency: "933",
        Info,
    };

    try {
        const { data } = await axios.post(url, dataInvoices, {
            params: { token },
        });

        // ⬇️ ДОБАВЛЯЕМ: обновляем isPayment в БД
        if (data && data.InvoiceNo) {
            await Order.update(
                { isPayment: 'wait' },
                { where: { order_number: AccountNo } }
            );
        }

        return res.json(data);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.response ? error.response.data : error.message);
        return res.status(500).json({ error: 'Ошибка при выполнении запроса', details: error.message });
    }
};

delInvoicesPay = async (req, res) => {
    const { InvoiceNo } = req.body;
    const token = process.env.TOKEN_PAY;

    const url1 = `https://api.express-pay.by/v1/invoices/`;

    const { data: data1 } = await axios.get(url1, {
        params: {
            token,
            AccountNo: InvoiceNo,
        },
    });

    const url = `https://api.express-pay.by/v1/invoices/${data1.Items[0].InvoiceNo}`;

    try {
        const { data } = await axios.delete(url, {
            params: { token },
        });

        // ⬇️ ДОБАВЛЯЕМ: сбрасываем isPayment
        await Order.update(
            { isPayment: 'none' },
            { where: { order_number: InvoiceNo } }
        );

        return res.json(data);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.response ? error.response.data : error.message);
        return res.status(500).json({ error: 'Ошибка при выполнении запроса', details: error.message });
    }
};

payNotice = async (req, res) => {
    const { Data } = req.body;

    let parsedData;
    if (typeof Data === 'string') {
        parsedData = JSON.parse(Data);
    } else {
        parsedData = Data;
    }

    const AccountNo = parsedData.AccountNo;

    if (parsedData.CmdType === 1) {
        await Order.update(
            { isPayment: 'paid' },
            { where: { order_number: AccountNo } }
        );
    }

    return res.status(200).json('ok');
};


  
  
}

module.exports = new euroPostController();