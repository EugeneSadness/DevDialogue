const { Sequelize } = require("sequelize");

module.exports = new Sequelize('new_bd','bulbazavr','QWE123',{
    dialect: 'postgres',
    host: 'localhost',
    port: 5432
    }
);