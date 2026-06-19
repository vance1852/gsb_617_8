const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const { DataTypes } = Sequelize;

const ShortUrl = sequelize.define(
  "ShortUrl",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shortCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    longUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    maxClicks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    clickCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "short_urls",
    timestamps: true,
  },
);

module.exports = ShortUrl;
