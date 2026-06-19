const sequelize = require('../config/database');
const User = require('./User');
const ShortUrl = require('./ShortUrl');
const ClickLog = require('./ClickLog');

ShortUrl.hasMany(ClickLog, { foreignKey: 'shortUrlId', as: 'clicks' });
ClickLog.belongsTo(ShortUrl, { foreignKey: 'shortUrlId' });

module.exports = {
  sequelize,
  User,
  ShortUrl,
  ClickLog
};
