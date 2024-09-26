const axios = require('axios');
const {Order} = require('../models/models')
const { Sequelize } = require('sequelize');
require('dotenv').config()

class euroPostController {

  getJWT = async () => {
    const { data } = await axios.post('https://api.eurotorg.by:10352/Json', {
      "CRC": "",
      "Packet": {
        "JWT": "null",
        "MethodName": "GetJWT",
        "ServiceNumber": "58DDAE9D-545D-4059-9387-8E71C3BCF202",
        "Data": {
          "LoginName": "591870601_Verbol'",
          "Password": "3IOSGZVLTD86JP4",
          "LoginNameTypeId": "1"
        }
      }
    });

    return data.Table[0].JWT;
  }

  getListOps = async (req, res) => {
    const jwt = await this.getJWT();

    const response = await axios.post('https://api.eurotorg.by:10352/Json', {
      "CRC": "",
      "Packet": {
        "JWT": jwt,
        "MethodName": "Postal.OfficesOut",
        "ServiceNumber": "58DDAE9D-545D-4059-9387-8E71C3BCF202",
        "Data": {
          "TypeSender": "2"
        }
      }
    });

    return res.json(response.data);
  }

  getInfo = async (req, res) => {
    const jwt = await this.getJWT();

    return res.json(jwt);
  }

  sendOrder = async (req, res) => {
    const {sum, OPS, phone, name1, name2} = req.body

    const jwt = await this.getJWT();
    
    const {data} = await axios.post('https://api.eurotorg.by:10352/Json', {  
        "CRC":"",
        "Packet":{  
          "JWT": jwt,
          "MethodName": "Postal.PutOrder",
          "ServiceNumber": "58DDAE9D-545D-4059-9387-8E71C3BCF202",
          "Data":  
          {  
            "GoodsId": 836884,
            "PostDeliveryTypeId": 1,
            "PostalWeightId": 20,
            "CashOnDeliverySum": sum,
            "CashOnDeliveryDeclareValueSum": sum,
            "WarehouseIdStart": 40130050,
            "WarehouseIdFinish": OPS,
            "PhoneNumberReciever": phone,
            "Name1Reciever": name1,
            "Name2Reciever": name2,
            "CashOnDeliveryMoneyBackId": 0,
            "IsRecieverShipping": 1,
            "IsRecieverCashOnDelivery": 1
          }
        }
    });

    return res.json(data);
  }

  checkOrder = async (req, res) => {
    const {number} = req.body

    const jwt = await this.getJWT();
    
    const {data} = await axios.post('https://api.eurotorg.by:10352/Json', {  
      "CRC":"",
      "Packet":{  
         "JWT": jwt,
         "MethodName": "Postal.OrderInfo",
         "ServiceNumber": "58DDAE9D-545D-4059-9387-8E71C3BCF202",
         "Data":  
         {  
            "Number":number
         }
      }
   });

    return res.json(data);
  }

  

  changeOrderEP = async (req, res) => {
    const {name1, name2, phone, ops, price, number} = req.body

    const jwt = await this.getJWT();
    
    const {data} = await axios.post('https://api.eurotorg.by:10352/Json', {  
      "CRC":"",
      "Packet":{  
         "JWT": jwt,
         "MethodName": "Postal.ChangeOrder",
         "ServiceNumber": "58DDAE9D-545D-4059-9387-8E71C3BCF202",
         "Data":  
         {  
            "Number":number,
            "CashOnDeliverySumNew":price,
            "CashOnDeliveryDeclareValueSumNew":price,
            "WarehouseIdFinishNew":ops,
            "PhoneNumberRecieverNew":phone,
            "Name1RecieverNew":name1,
            "Name2RecieverNew":name2
         }
      }
   });

    return res.json(data);
  }

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

  const {AccountNo, Amount, Info} = req.body

  const token = process.env.TOKEN_PAY;
  const isTest = false; // true для тестового окружения, false для боевого

  // Формируем URL в зависимости от окружения
  const url = isTest
      ? `https://sandbox-api.express-pay.by/v1/invoices/`
      : `https://api.express-pay.by/v1/invoices/`;

  const dataInvoices = {
    AccountNo,
    Amount,
    Currency: "933",
    Info
  }

  try {
      // Выполняем GET-запрос с токеном в URL
      const { data } = await axios.post(url, dataInvoices, {
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

delInvoicesPay = async (req, res) => {
  const {InvoiceNo} = req.body
  const token = process.env.TOKEN_PAY;

  const url1 =  `https://api.express-pay.by/v1/invoices/`;
    // Выполняем GET-запрос с токеном в URL
    const { data } = await axios.get(url1, {
        params: {
            token: token,
            AccountNo: InvoiceNo
        }
    });


  const url = `https://api.express-pay.by/v1/invoices/${data.Items[0].InvoiceNo}`;

  try {
      // Выполняем GET-запрос с токеном в URL
      const { data } = await axios.delete(url, {
        params: {
          token: token
      }
      });

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

  const AccountNo = parsedData.AccountNo

  if(parsedData.CmdType===1){
    await Order.update(
      { other: Sequelize.fn('concat', 'оплачено!\n\n', Sequelize.col('other')) }, 
      { where: { order_number: AccountNo } } 
    );
  }

  return res.status(200).json('ok')
};


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

  
  
}

module.exports = new euroPostController();