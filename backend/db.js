const { Sequelize } = require("sequelize");

module.exports = new Sequelize('test_messenger','eugene','king5681',{
    dialect: 'postgres',
    host: 'localhost',
    port: 5432
    }
);