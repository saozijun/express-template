const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 认证路由 - 使用标准后缀格式
router.post('/register', register);
router.post('/login', login);
router.post('/logout', (req, res) => {
  // 由于JWT是无状态的，客户端需要自行清除token
  return res.json({ success: true, message: '注销成功' });
});
router.get('/current', protect, getMe);

// 兼容旧路由
router.get('/me', protect, getMe);

module.exports = router; 