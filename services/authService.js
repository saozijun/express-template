const User = require('../models/User');
const Role = require('../models/Role');

/**
 * 认证业务逻辑层
 */

// 用户注册
exports.register = async (userData) => {
  try {
    const { username, email, password } = userData;
    
    // 检查用户名是否已存在
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      return {
        success: false,
        message: '该用户名已被注册',
        statusCode: 400
      };
    }
    
    // 检查邮箱是否已存在
    if (email) {
      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return {
          success: false,
          message: '该邮箱已被注册',
          statusCode: 400
        };
      }
    }
    
    // 获取默认用户角色(user)
    const userRole = await Role.findOne({ where: { name: 'user' } });
    if (!userRole) {
      return {
        success: false,
        message: '系统错误：未找到默认用户角色',
        statusCode: 500
      };
    }
    
    // 创建用户
    const user = await User.create({
      username,
      email,
      password,
      nickname: userData.nickname || username,
      roleId: userRole.id // 使用默认user角色ID
    });
    
    // 生成token
    const token = user.getSignedJwtToken();
    
    return {
      success: true,
      token,
      statusCode: 200
    };
  } catch (error) {
    console.error('用户注册错误:', error);
    
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

// 用户登录
exports.login = async (credentials) => {
  try {
    const { username, password } = credentials;
    
    // 验证用户名和密码
    if (!username || !password) {
      return {
        success: false,
        message: '请提供用户名和密码',
        statusCode: 400
      };
    }
    
    // 检查用户是否存在
    const user = await User.findOne({ 
      where: { username },
      include: ['role'] // 包含角色信息
    });
    
    if (!user) {
      return {
        success: false,
        message: '用户不存在',
        statusCode: 500
      };
    }
    
    // 检查密码是否匹配
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return {
        success: false,
        message: '密码错误',
        statusCode: 500
      };
    }
    
    // 检查用户状态
    if (user.status !== 'active') {
      return {
        success: false,
        message: '账号已被禁用，请联系管理员',
        statusCode: 500
      };
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    // 生成token
    const token = user.getSignedJwtToken();
    
    // 准备返回的用户数据
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role ? user.role.name : null,
      status: user.status,
      token
    };
    
    return {
      success: true,
      token,
      data: userData,
      statusCode: 200
    };
  } catch (error) {
    console.error('用户登录错误:', error);
    throw new Error(error.message);
  }
};

// 获取当前用户
exports.getMe = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      include: ['role'],
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return {
        success: false,
        message: '用户不存在',
        statusCode: 500
      };
    }
    
    return {
      success: true,
      data: user,
      statusCode: 200
    };
  } catch (error) {
    console.error('获取当前用户错误:', error);
    throw new Error(error.message);
  }
}; 