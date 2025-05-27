const { error } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('错误信息:', err);
  
  // Sequelize 验证错误
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return error(res, '数据验证错误', 400, messages);
  }
  
  // Sequelize 唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(e => e.message);
    return error(res, '数据已存在', 400, messages);
  }
  
  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return error(res, '无效的令牌', 401);
  }
  
  // JWT 过期错误
  if (err.name === 'TokenExpiredError') {
    return error(res, '令牌已过期', 401);
  }
  
  // 默认服务器错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  return error(res, message, statusCode);
};

module.exports = errorHandler; 