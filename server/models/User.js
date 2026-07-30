const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.STRING, // Firebase UID is used as the primary key
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      // Optional. Not used for Google sign-in, kept for schema completeness
      // in case email/password auth is added later. Never store plaintext.
      type: DataTypes.STRING,
      allowNull: true,
    },
    gmailEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gmailAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gmailRefreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gmailTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true, // adds createdAt / updatedAt
  }
);

module.exports = User;
