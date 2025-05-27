const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');
const {
  uploadFile,
  uploadMultipleFiles,
  getUserFiles,
  getFileById,
  deleteFile,
  updateFile,
  getFilesPage
} = require('../controllers/fileController');

// 文件路由 - 使用标准后缀格式
router.post('/upload', protect, upload.single('file'), uploadFile);
router.post('/uploads', protect, upload.array('files', 5), uploadMultipleFiles);
router.get('/list', protect, getUserFiles);
router.get('/page', protect, getFilesPage); // 使用专门的分页查询方法
router.get('/detail/:id', protect, getFileById);
router.post('/delete', protect, deleteFile);
router.post('/save', protect, updateFile);

// 兼容旧路由
router.post('/upload-multiple', protect, upload.array('files', 5), uploadMultipleFiles);
router.get('/', protect, getUserFiles);
router.get('/:id', protect, getFileById);
router.delete('/:id', protect, deleteFile);
router.put('/:id', protect, updateFile);

module.exports = router; 