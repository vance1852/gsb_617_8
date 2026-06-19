const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const { DataTypes } = Sequelize;

const ClickLog = sequelize.define(
  "ClickLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shortUrlId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    referer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "click_logs",
    timestamps: true,
  },
);

module.exports = ClickLog;
