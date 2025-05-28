const User = require('../models/User');
const Role = require('../models/Role');
const File = require('../models/File');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const { sequelize } = require('./db');

// 初始化数据库表结构
const initDB = async () => {
  try {
    // 确保表已同步
    await User.sync();
    await Role.sync();
    await File.sync();
    await Chat.sync();
    await ChatMessage.sync();
    
    console.log('数据库表同步成功');
    
    // 检查是否需要创建默认角色
    const roleCount = await Role.count();
    if (roleCount === 0) {
      await Role.bulkCreate([
        { name: 'admin', description: '管理员' },
        { name: 'user', description: '普通用户' }
      ]);
      console.log('创建默认角色成功');
    }
    
    // 检查是否需要创建默认管理员用户
    const adminExists = await User.findOne({
      where: { username: 'admin' }
    });
    
    if (!adminExists) {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      
      if (adminRole) {
        await User.create({
          username: 'admin',
          password: '123456', // 初始密码，实际应用中应使用更复杂的密码
          email: 'admin@example.com',
          roleId: adminRole.id,
          isActive: true
        });
        console.log('创建默认管理员成功');
      }
    }
  } catch (error) {
    console.error('数据库初始化错误:', error);
  }
};

module.exports = initDB; 