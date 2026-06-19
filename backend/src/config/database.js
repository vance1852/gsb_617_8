const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'shorturl',
  process.env.DB_USER || 'shorturl',
  process.env.DB_PASSWORD || 'shorturl123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
