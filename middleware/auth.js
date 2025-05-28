const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 保护路由
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // 从header中获取token
    token = req.headers.authorization.split(' ')[1];
  }

  // 确保token存在
  if (!token) {
    return res.status(401).json({ success: false, message: '没有访问权限' });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findByPk(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '没有访问权限' });
  }
}; 