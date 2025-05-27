const Role = require('../models/Role');
const User = require('../models/User');

// 初始化默认角色和管理员用户
const initDefaultData = async () => {
  try {
    // 创建默认角色
    const roles = [
      {
        name: 'admin',
        description: '系统管理员，拥有所有权限'
      },
      {
        name: 'user',
        description: '普通用户'
      },
      {
        name: 'guest',
        description: '访客用户'
      }
    ];

    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData
      });

      if (created) {
        console.log(`创建角色: ${role.name}`);
      } else {
        console.log(`角色已存在: ${role.name}`);
      }
    }

    // 创建管理员用户
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (adminRole) {
      const [adminUser, created] = await User.findOrCreate({
        where: { username: 'admin' },
        defaults: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123',
          roleId: adminRole.id,
          status: 'active'
        }
      });

      if (created) {
        console.log('创建管理员用户成功');
      } else {
        console.log('管理员用户已存在');
      }
    }

    console.log('初始化默认数据完成');
  } catch (error) {
    console.error('初始化默认数据错误:', error);
  }
};

module.exports = initDefaultData; 