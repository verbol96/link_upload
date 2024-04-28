const axios = require('axios');

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

  
  
}

module.exports = new euroPostController();