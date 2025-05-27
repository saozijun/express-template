const roleService = require('../services/roleService');
const { success, error } = require('../utils/response');

/**
 * 角色控制器
 */

// @desc    创建角色
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = async (req, res) => {
  try {
    const result = await roleService.createRole(req.body);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode);
    }
    
    return success(res, result.data, '角色创建成功', result.statusCode);
  } catch (err) {
    console.error('创建角色失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取所有角色
// @route   GET /api/roles
// @access  Private/Admin
exports.getAllRoles = async (req, res) => {
  try {
    const result = await roleService.getAllRoles();
    
    if (!result.success) {
      return error(res, result.message, 500);
    }
    
    return success(res, result.data, '获取角色列表成功');
  } catch (err) {
    console.error('获取角色列表失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取角色分页列表
// @route   GET /role/page
// @access  Private/Admin
exports.getRolesPage = async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 10, name } = req.query;
    
    // 构建查询条件
    const query = {};
    if (name) query.name = { $like: `%${name}%` };
    
    const result = await roleService.getRolesPage(parseInt(pageNum), parseInt(pageSize), query);
    
    if (result.success) {
      return success(res, {
        records: result.data.rows,
        total: result.data.count,
        pageNum: parseInt(pageNum),
        pageSize: parseInt(pageSize)
      }, '获取角色分页列表成功', 200);
    } else {
      return error(res, result.message, 500);
    }
  } catch (err) {
    console.error('获取角色分页列表失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取单个角色
// @route   GET /api/roles/:id
// @access  Private/Admin
exports.getRoleById = async (req, res) => {
  try {
    const result = await roleService.getRoleById(req.params.id);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, result.data, '获取角色成功');
  } catch (err) {
    console.error('获取角色失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    更新角色
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = async (req, res) => {
  try {
    const id = req.body.id || req.params.id;
    const result = await roleService.updateRole(id, req.body);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, result.data, '角色更新成功');
  } catch (err) {
    console.error('更新角色失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    删除角色
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = async (req, res) => {
  try {
    const id = req.body.id || req.params.id;
    const result = await roleService.deleteRole(id);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, null, result.message);
  } catch (err) {
    console.error('删除角色失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    为用户分配角色
// @route   POST /api/roles/assign
// @access  Private/Admin
exports.assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    if (!userId || !roleId) {
      return error(res, '请提供用户ID和角色ID', 400);
    }
    
    const result = await roleService.assignRoleToUser(userId, roleId);
    
    if (!result.success) {
      return error(res, result.message, result.statusCode || 404);
    }
    
    return success(res, result.data, result.message);
  } catch (err) {
    console.error('分配角色失败:', err);
    return error(res, '服务器错误', 500);
  }
}; 