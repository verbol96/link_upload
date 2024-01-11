const sequelize = require('../db');
const { DataTypes, UUIDV4 } = require('sequelize'); 

const User = sequelize.define('user', {
  id: { type: DataTypes.UUID, primaryKey: true,defaultValue: UUIDV4 },
  phone: { type: DataTypes.STRING, unique: true },
  FIO: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'USER' },
  typePost: {type: DataTypes.STRING},
  postCode: {type: DataTypes.STRING},
  city: {type: DataTypes.STRING},
  adress: {type: DataTypes.STRING},
  oblast: {type: DataTypes.STRING},
  raion: {type: DataTypes.STRING},
});

const Order = sequelize.define('order', {
  id: { type: DataTypes.UUID, primaryKey: true,defaultValue: UUIDV4 },
  order_number: { type: DataTypes.INTEGER,autoIncrement: true},
  codeOutside: {type: DataTypes.STRING },
  price: {type: DataTypes.STRING},
  other: {type: DataTypes.STRING }, 
  notes: {type: DataTypes.STRING }, 
  status: {type: DataTypes.INTEGER},
  typePost: {type: DataTypes.STRING},
  firstClass: {type: DataTypes.BOOLEAN, defaultValue: false},
  postCode: {type: DataTypes.STRING},
  city: {type: DataTypes.STRING},
  adress: {type: DataTypes.STRING},
  oblast: {type: DataTypes.STRING},
  raion: {type: DataTypes.STRING},
  FIO: {type: DataTypes.STRING},
  phone: {type: DataTypes.STRING},
  price_deliver: {type: DataTypes.STRING},
  main_dir_id: { type: DataTypes.UUID}
})


const Token = sequelize.define('token', {
  id: { type: DataTypes.UUID, primaryKey: true,defaultValue: UUIDV4 },
  refreshToken:{type: DataTypes.STRING}
})


const Photo = sequelize.define('photo', {
    id: { type: DataTypes.UUID, primaryKey: true,defaultValue: UUIDV4 },
    type: {type: DataTypes.STRING},
    format: {type: DataTypes.STRING},
    amount: {type: DataTypes.INTEGER},
    paper: {type: DataTypes.STRING},
    copies: {type: DataTypes.INTEGER, defaultValue: 1}
})

const Settings = sequelize.define('settings', {
    id: { type: DataTypes.UUID, primaryKey: true,defaultValue: UUIDV4 },
    type:{type: DataTypes.STRING},
    title:{type: DataTypes.STRING},
    price:{type: DataTypes.STRING},

})

const SettingsEditor = sequelize.define('settingsEditor', {
  id: { type: DataTypes.UUID, primaryKey: true,defaultValue: UUIDV4 },
  size:{type: DataTypes.STRING},
  aspectRatio:{type: DataTypes.STRING},
  up:{type: DataTypes.STRING},
  down:{type: DataTypes.STRING},
  left:{type: DataTypes.STRING},
  right:{type: DataTypes.STRING}
})

const SettingEditor = sequelize.define('settingEditor', {
  id: { type: DataTypes.UUID, primaryKey: true,defaultValue: UUIDV4 },
  name:{type: DataTypes.STRING},
  width:{type: DataTypes.STRING},
  height:{type: DataTypes.STRING},
  top:{type: DataTypes.STRING},
  bottom:{type: DataTypes.STRING},
  left:{type: DataTypes.STRING},
  right:{type: DataTypes.STRING}
})

const File = sequelize.define('file', {
    id: { type: DataTypes.UUID, primaryKey: true,defaultValue: UUIDV4 },
    name:{type: DataTypes.STRING},
    type:{type: DataTypes.STRING},
    size:{type: DataTypes.INTEGER, defaultValue: 0},
    path:{type: DataTypes.STRING, defaultValue: ''},
    parent:{type: DataTypes.UUID}
})

User.hasMany(Order)
Order.belongsTo(User)

Order.hasMany(Photo)
Photo.belongsTo(Order) 

Token.belongsTo(User)

Photo.hasMany(File)
File.belongsTo(Photo)

module.exports = {User, Order, Photo, Settings, Token, File, SettingsEditor, SettingEditor}