'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users',{ 
      id: {type: Sequelize.DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
      name: {type: Sequelize.DataTypes.STRING, allowNull: false},
      email: {type: Sequelize.DataTypes.STRING,allowNull: false, unique: true},
      password: {type: Sequelize.DataTypes.STRING, allowNull: false},
      profileInfo: {type: Sequelize.DataTypes.STRING}
  });

  await queryInterface.createTable('chatUsers',{
    id: {type: Sequelize.DataTypes.INTEGER, primaryKey: true, autoIncrement: true}
  });

  await queryInterface.createTable('userTypes',{
    id: {type: Sequelize.DataTypes.INTEGER, primaryKey: true}
  });

  await queryInterface.createTable('userFriends', {
    id: {type: Sequelize.DataTypes.INTEGER, primaryKey: true}
  });

  await queryInterface.createTable('chats', {
    id: {type: Sequelize.DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title: {type: Sequelize.DataTypes.STRING, allowNull: false}
  });

  await queryInterface.createTable('chatMessages', {
    id: {type: Sequelize.DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: Sequelize.DataTypes.STRING, unique: true, allowNull: true}
  });

  await queryInterface.createTable('messages', {
    id: {type: Sequelize.DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    senderId: {type: Sequelize.DataTypes.INTEGER, allowNull: false},
    content: {type: Sequelize.DataTypes.STRING}
  });

  await queryInterface.createTable('messageFiles',{
    id: {type: Sequelize.DataTypes.INTEGER, primaryKey: true, autoIncrement: true}
  });

  await queryInterface.createTable('files', {
    path: {type: Sequelize.DataTypes.STRING, unique:true}
  });

  },
  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
