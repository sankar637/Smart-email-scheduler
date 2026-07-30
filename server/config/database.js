const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config();

const storagePath = process.env.DB_STORAGE_PATH
  ? path.resolve(process.env.DB_STORAGE_PATH)
  : path.resolve(__dirname, "..", "database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storagePath,
  logging: false,
});

module.exports = sequelize;
