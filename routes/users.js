const express = require("express");
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin, isUser } = require('../middleware/roleCheck');
const { upload } = require('../utils/fileUpload');
const { 
  getAllUsers, 
  getUserById, 
  updateUser,
  deleteUser,
  uploadAvatar,
  updateUserStatus,
  getUsersPage,
  createUser
} = require('../controllers/userController');

// 创建头像上传目录
const fs = require('fs');
const path = require('path');
const avatarDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// 配置头像上传
const multer = require('multer');
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// 用户路由 - 使用标准后缀格式
router.get("/list", protect, isUser, getAllUsers);
router.get("/page", protect, isUser, getUsersPage); // 使用专门的分页查询方法
router.get("/detail/:id", protect, isUser, getUserById);
router.post("/add", protect, isAdmin, createUser); // 新增用户接口，仅管理员可访问
router.post("/save", protect, updateUser);
router.post("/delete", protect, deleteUser);
router.post("/status", protect, isAdmin, updateUserStatus);

// 头像上传路由
router.post("/upload/avatar", protect, avatarUpload.single('avatar'), uploadAvatar);

// 兼容旧路由
router.get("/", protect, isUser, getAllUsers);
router.get("/:id", protect, isUser, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);
router.post("/:id/avatar", protect, avatarUpload.single('avatar'), uploadAvatar);
router.patch("/:id/status", protect, isAdmin, updateUserStatus);

module.exports = router;
