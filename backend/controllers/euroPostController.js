const axios = require('axios');
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


    // Формируем URL в зависимости от окружения
    const url =  `https://api.express-pay.by/v1/invoices/${data.Items[0].InvoiceNo}/status`

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

  
  
}

module.exports = new euroPostController();