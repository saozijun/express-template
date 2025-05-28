const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

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
        };
      }
    }
    
    // 更新头像URL
    if (updateData.avatarUrl) {
      updateData.avatar = updateData.avatarUrl;
      delete updateData.avatarUrl;
    }
    
    // 直接使用模型的update方法
    await User.update(updateData, {
      where: { id: userId },
      individualHooks: true // 确保钩子被触发
    });
    
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
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return {
        success: false,
        message: '验证错误'
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
      } catch (err) {}
    }
    
    // 更新用户头像路径
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    
    try {
      // 使用更明确的方式更新头像
      await User.update(
        { avatar: avatarUrl },
        { where: { id: userId } }
      );
      
      // 验证更新是否成功
      const updatedUser = await User.findByPk(userId);
      if (updatedUser.avatar !== avatarUrl) {
        return {
          success: false,
          message: '头像更新失败',
        };
      }
      
      return {
        success: true,
        data: {
          avatar: avatarUrl
        },
        message: '头像上传成功'
      };
    } catch (updateError) {
      return {
        success: false,
        message: '头像上传成功但更新用户信息失败',
        error: updateError.message
      };
    }
  } catch (error) {
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

// 修改密码
exports.changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return {
        success: false,
        message: '未找到用户'
      };
    }
    
    if (!isMatch) {
      return {
        success: false,
        message: '当前密码不正确',
      };
    }
    
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return {
        success: false,
        message: '新密码不能与当前密码相同',
      };
    }
    
    // 直接使用update方法更新密码，让模型的beforeUpdate钩子处理密码加密
    await User.update(
      { password: newPassword },
      { 
        where: { id: userId },
        individualHooks: true // 确保钩子被触发
      }
    );
    
    // 验证密码是否更新成功
    const updatedUser = await User.findByPk(userId);
    const newPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
    if (!newPasswordValid) {
      return {
        success: false,
        message: '密码更新失败',
      };
    }
    
    return {
      success: true,
      message: '密码修改成功'
    };
  } catch (error) {
    console.error(`修改密码错误:`, error);
    throw new Error(error.message);
  }
};

// 重置用户密码（管理员操作）
exports.resetPassword = async (userId, newPassword) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return {
        success: false,
        message: '未找到用户'
      };
    }
    
    // 直接使用update方法重置密码，让模型的beforeUpdate钩子处理密码加密
    await User.update(
      { password: newPassword },
      { 
        where: { id: userId },
        individualHooks: true // 确保钩子被触发
      }
    );
    
    return {
      success: true,
      message: '密码重置成功'
    };
  } catch (error) {
    console.error(`重置密码错误:`, error);
    throw new Error(error.message);
  }
}; 