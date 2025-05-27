const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');

/**
 * 用户业务逻辑层
 */

// 创建用户
exports.createUser = async (userData) => {
  try {
    // 检查用户名是否已存在
    const existingUserByUsername = await User.findOne({ where: { username: userData.username } });
    if (existingUserByUsername) {
      return {
        success: false,
        message: '该用户名已被注册',
        errors: ['该用户名已被注册'],
        statusCode: 400
      };
    }
    
    // 检查邮箱是否已存在（如果提供了邮箱）
    if (userData.email) {
      const existingUserByEmail = await User.findOne({ where: { email: userData.email } });
      if (existingUserByEmail) {
        return {
          success: false,
          message: '该邮箱已被注册',
          errors: ['该邮箱已被注册'],
          statusCode: 400
        };
      }
    }
    
    // 创建用户
    const user = await User.create({
      username: userData.username,
      password: userData.password,
      email: userData.email,
      nickname: userData.nickname || userData.username,
      roleId: userData.roleId,
      status: userData.status || 'active'
    });
    
    // 重新获取用户信息，包含角色
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: ['role']
    });
    
    return {
      success: true,
      statusCode: 200
    };
  } catch (error) {
    console.error('创建用户错误:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return {
        success: false,
        message: '验证错误',
        errors: messages,
        statusCode: 400
      };
    }
    
    throw new Error(error.message);
  }
};

// 获取所有用户
exports.getAllUsers = async () => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: ['role']
    });
    
    return {
      success: true,
      count: users.length,
      data: users
    };
  } catch (error) {
    console.error('获取用户列表错误:', error);
    throw new Error(error.message);
  }
};

// 获取用户分页列表
exports.getUsersPage = async (pageNum, pageSize, query = {}) => {
  try {
    // 处理查询条件
    const whereClause = {};
    
    // 按昵称查询
    if (query.nickname) {
      whereClause.nickname = {
        [Op.like]: `%${query.nickname}%`
      };
    }
    
    // 按角色查询
    if (query.role) {
      whereClause.roleId = query.role;
    }
    
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: pageSize,
      offset: (pageNum - 1) * pageSize,
      order: [['createdAt', 'DESC']],
      include: ['role']
    });
    
    return {
      success: true,
      data: {
        count,
        rows
      }
    };
  } catch (error) {
    console.error('获取用户分页列表错误:', error);
    throw new Error(error.message);
  }
};

// 根据ID获取用户
exports.getUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: ['role']
    });
    
    if (!user) {
      return {
        success: false,
        message: '未找到用户'
      };
    }
    
    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error(`获取用户(ID: ${userId})错误:`, error);
    throw new Error(error.message);
  }
};

// 更新用户信息
exports.updateUser = async (userId, updateData) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return {
        success: false,
        message: '未找到用户'
      };
    }
    
    // 如果更新email，检查是否已存在
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: updateData.email } });
      if (existingUser) {
        return {
          success: false,
          message: '该邮箱已被使用',
          errors: ['该邮箱已被使用']
        };
      }
    }
    
    // 如果更新username，检查是否已存在
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ where: { username: updateData.username } });
      if (existingUser) {
        return {
          success: false,
          message: '该用户名已被使用',
          errors: ['该用户名已被使用']
        };
      }
    }
    
    await user.update(updateData);
    
    // 重新获取用户信息，包含角色
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: ['role']
    });
    
    return {
      success: true,
      data: updatedUser
    };
  } catch (error) {
    console.error(`更新用户(ID: ${userId})错误:`, error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return {
        success: false,
        message: '验证错误',
        errors: messages
      };
    }
    
    throw new Error(error.message);
  }
};

// 删除用户
exports.deleteUser = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return {
        success: false,
        message: '未找到用户'
      };
    }
    
    await user.destroy();
    
    return {
      success: true,
      message: '用户删除成功'
    };
  } catch (error) {
    console.error(`删除用户(ID: ${userId})错误:`, error);
    throw new Error(error.message);
  }
};

// 上传头像
exports.uploadAvatar = async (userId, file) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return {
        success: false,
        message: '未找到用户'
      };
    }
    
    // 如果用户已有头像且不是默认头像，删除旧头像
    if (user.avatar && !user.avatar.includes('default.png')) {
      try {
        const oldAvatarPath = path.join(__dirname, '..', user.avatar);
        await fs.access(oldAvatarPath);
        await fs.unlink(oldAvatarPath);
      } catch (err) {
        console.error('删除旧头像失败:', err);
        // 继续执行，即使删除失败
      }
    }
    
    // 更新用户头像路径
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await user.update({ avatar: avatarUrl });
    
    return {
      success: true,
      data: {
        avatar: avatarUrl
      },
      message: '头像上传成功'
    };
  } catch (error) {
    console.error(`上传头像错误:`, error);
    throw new Error(error.message);
  }
};

// 更新用户状态
exports.updateUserStatus = async (userId, status) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return {
        success: false,
        message: '未找到用户'
      };
    }
    
    // 验证状态值
    const validStatuses = ['active', 'inactive', 'banned'];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: '无效的状态值',
        errors: ['状态必须是 active, inactive 或 banned']
      };
    }
    
    await user.update({ status });
    
    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        status: user.status
      },
      message: '用户状态更新成功'
    };
  } catch (error) {
    console.error(`更新用户状态错误:`, error);
    throw new Error(error.message);
  }
}; 