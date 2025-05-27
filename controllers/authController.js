const authService = require('../services/authService');
const { success, error } = require('../utils/response');

// @desc    注册用户
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode, result.errors);
    }
    
    return success(res, { token: result.token }, '用户注册成功', result.statusCode);
  } catch (err) {
    console.error('注册失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode);
    }
    
    return success(res, result.data, '登录成功', result.statusCode);
  } catch (err) {
    console.error('登录失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取当前登录用户
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const result = await authService.getMe(req.user.id);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode);
    }
    
    return success(res, result.data, '获取用户信息成功');
  } catch (err) {
    console.error('获取当前用户失败:', err);
    return error(res, '服务器错误', 500);
  }
}; 