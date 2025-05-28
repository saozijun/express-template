const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/response');

// 保护路由 - 必须登录
exports.protect = async (req, res, next) => {
  let token;

  // 从请求头或Cookie中获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 检查token是否存在
  if (!token) {
    return error(res, '未授权访问，请先登录', 401);
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return error(res, '用户不存在', 401);
    }

    // 将用户添加到请求对象
    req.user = user;
    next();
  } catch (err) {
    return error(res, '未授权访问，请先登录', 401);
  }
};

// 可选认证 - 匿名用户也允许访问
exports.optionalProtect = async (req, res, next) => {
  let token;

  // 从请求头或Cookie中获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 如果没有token，继续处理请求，但req.user为undefined
  if (!token) {
    return next();
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户
    const user = await User.findByPk(decoded.id);

    // 将用户添加到请求对象
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Token无效时不返回错误，只是不设置req.user
    console.error('Token验证失败:', err);
  }
  
  next();
}; 