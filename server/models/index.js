const sequelize = require("../config/database");
const User = require("./User");
const Email = require("./Email");

User.hasMany(Email, { foreignKey: "userId", onDelete: "CASCADE" });
Email.belongsTo(User, { foreignKey: "userId" });

async function initDatabase() {
  // alter:true keeps schema in sync during development without dropping data.
  await sequelize.query("PRAGMA foreign_keys = OFF");
  await sequelize.sync({ alter: true });
  await sequelize.query("PRAGMA foreign_keys = ON");
  console.log("[database] SQLite connected and models synced.");
}

module.exports = { sequelize, User, Email, initDatabase };
