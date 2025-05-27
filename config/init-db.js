const { sequelize } = require('./db');
const initDefaultData = require('./init-data');

const initDB = async () => {
  try {
    // 同步所有模型到数据库
    await sequelize.sync({ alter: true });
    // console.log('数据库表同步完成');
    
    // 初始化默认数据
    // await initDefaultData();
  } catch (error) {
    console.error('数据库初始化错误:', error);
    process.exit(1);
  }
};

module.exports = initDB; 