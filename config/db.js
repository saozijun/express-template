const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(
  process.env.DB_NAME || 'express_app', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASSWORD || '', 
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("服务启动成功");
    
    // console.log('MySQL数据库连接成功');
  } catch (error) {
    console.error(`MySQL数据库连接错误: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 