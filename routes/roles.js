const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { 
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignRoleToUser,
  getRolesPage
} = require('../controllers/roleController');

// 角色路由 - 使用标准后缀格式
router.post('/save', protect, isAdmin, createRole);
router.get('/list', protect, isAdmin, getAllRoles);
router.get('/page', protect, isAdmin, getRolesPage);
router.get('/detail/:id', protect, isAdmin, getRoleById);
router.post('/delete', protect, isAdmin, deleteRole);
router.post('/assign', protect, isAdmin, assignRoleToUser);
router.get('/roleList', getAllRoles); // 获取角色下拉列表数据

// 兼容旧路由
router.post('/', protect, isAdmin, createRole);
router.get('/', protect, isAdmin, getAllRoles);
router.get('/:id', protect, isAdmin, getRoleById);
router.put('/:id', protect, isAdmin, updateRole);
router.delete('/:id', protect, isAdmin, deleteRole);

module.exports = router; 