const { error } = require('../utils/response');

/**
 * 基于角色名称的权限检查中间件
 * @param {string|string[]} roles - 允许访问的角色名称，可以是单个角色名或角色名数组
 */
const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      // 确保用户已登录且有角色ID
      if (!req.user || !req.user.roleId) {
        return error(res, '无权访问', 403);
      }
      
      // 加载用户角色
      const user = await req.user.reload({ include: ['role'] });
      
      // 如果用户没有角色，拒绝访问
      if (!user.role) {
        return error(res, '无权访问', 403);
      }
      
      // 检查用户角色是否在允许的角色列表中
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (allowedRoles.includes(user.role.name)) {
        next();
      } else {
        return error(res, '权限不足', 403);
      }
    } catch (err) {
      console.error('角色检查错误:', err);
      return error(res, '服务器错误', 500);
    }
  };
};

// 预定义的角色检查
exports.isAdmin = checkRole('admin');
exports.isUser = checkRole(['admin', 'user']);
exports.isGuest = checkRole(['admin', 'user', 'guest']);

// 导出通用角色检查函数
exports.checkRole = checkRole; 