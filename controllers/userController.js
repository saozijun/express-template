const userService = require('../services/userService');
const { success, error } = require('../utils/response');

/**
 * 用户控制器
 */

// @desc    获取所有用户
// @route   GET /users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers();
    
    if (result.success) {
      return success(res, result.data, '获取用户列表成功', 200);
    } else {
      return error(res, result.message, 500);
    }
  } catch (err) {
    console.error('获取用户列表失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取用户分页列表
// @route   GET /user/page
// @access  Private
exports.getUsersPage = async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 10, nickname, role } = req.query;
    
    // 构建查询条件
    const query = {};
    if (nickname) query.nickname = { $like: `%${nickname}%` };
    if (role) query.role = role;
    
    const result = await userService.getUsersPage(parseInt(pageNum), parseInt(pageSize), query);
    
    if (result.success) {
      return success(res, {
        records: result.data.rows,
        total: result.data.count,
        pageNum: parseInt(pageNum),
        pageSize: parseInt(pageSize)
      }, '获取用户分页列表成功', 200);
    } else {
      return error(res, result.message, 500);
    }
  } catch (err) {
    console.error('获取用户分页列表失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取单个用户
// @route   GET /users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const result = await userService.getUserById(req.params.id);
    
    if (!result.success) {
      return error(res, result.message, 404);
    }
    
    return success(res, result.data, '获取用户成功');
  } catch (err) {
    console.error('获取用户失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    创建新用户（仅管理员）
// @route   POST /user/add
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    // 检查是否为管理员
    const isAdmin = req.user.role && req.user.role.name === 'admin';
    
    if (!isAdmin) {
      return error(res, '需要管理员权限', 403);
    }
    
    const result = await userService.createUser(req.body);
    
    if (!result.success) {
      const statusCode = result.errors ? 400 : 500;
      return error(res, result.message, statusCode, result.errors);
    }
    
    return success(res, result.data, '用户创建成功', 201);
  } catch (err) {
    console.error('创建用户失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    更新用户信息
// @route   PUT /users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    // 检查是否为管理员或本人
    const isOwnAccount = req.body.id && req.body.id == req.user.id;
    const isAdmin = req.user.role && req.user.role.name === 'admin';
    
    if (!isOwnAccount && !isAdmin) {
      return error(res, '没有权限更新此用户', 401);
    }
    
    const result = await userService.updateUser(req.body.id || req.params.id, req.body);
    
    if (!result.success) {
      const statusCode = result.errors ? 400 : 404;
      return error(res, result.message, statusCode, result.errors);
    }
    
    return success(res, result.data, '用户信息更新成功');
  } catch (err) {
    console.error('更新用户失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    删除用户
// @route   DELETE /users/:id
// @access  Private
exports.deleteUser = async (req, res) => {
  try {
    // 检查是否为管理员或本人
    const isOwnAccount = req.body.id && req.body.id == req.user.id;
    const isAdmin = req.user.role && req.user.role.name === 'admin';
    
    if (!isOwnAccount && !isAdmin) {
      return error(res, '没有权限删除此用户', 401);
    }
    
    const result = await userService.deleteUser(req.body.id || req.params.id);
    
    if (!result.success) {
      return error(res, result.message, 404);
    }
    
    return success(res, null, '用户删除成功');
  } catch (err) {
    console.error('删除用户失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    上传用户头像
// @route   POST /users/:id/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    // 检查是否为管理员或本人
    const isOwnAccount = req.params.id == req.user.id;
    const isAdmin = req.user.role && req.user.role.name === 'admin';
    
    if (!isOwnAccount && !isAdmin) {
      return error(res, '没有权限上传此用户头像', 401);
    }
    
    if (!req.file) {
      return error(res, '请选择要上传的头像', 400);
    }
    
    const result = await userService.uploadAvatar(req.params.id, req.file);
    
    if (!result.success) {
      return error(res, result.message, 404);
    }
    
    return success(res, result.data, result.message);
  } catch (err) {
    console.error('上传头像失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    更新用户状态（仅管理员）
// @route   PATCH /users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    // 检查是否为管理员
    const isAdmin = req.user.role && req.user.role.name === 'admin';
    
    if (!isAdmin) {
      return error(res, '需要管理员权限', 403);
    }
    
    const { id, status } = req.body;
    
    if (!id || !status) {
      return error(res, '请提供用户ID和状态值', 400);
    }
    
    const result = await userService.updateUserStatus(id, status);
    
    if (!result.success) {
      const statusCode = result.errors ? 400 : 404;
      return error(res, result.message, statusCode, result.errors);
    }
    
    return success(res, result.data, result.message);
  } catch (err) {
    console.error('更新用户状态失败:', err);
    return error(res, '服务器错误', 500);
  }
}; 