const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const createUploadDirectories = () => {
  const directories = [
    './uploads',
    './uploads/images',
    './uploads/documents',
    './uploads/temp'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// 创建目录
createUploadDirectories();

// 存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = './uploads/temp';
    
    // 根据文件类型选择不同的目录
    if (file.mimetype.startsWith('image/')) {
      uploadPath = './uploads/images';
    } else if (
      file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/msword' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      uploadPath = './uploads/documents';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 上传限制
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 5 // 最多5个文件
};

// 导出配置好的multer实例
exports.upload = multer({
  storage,
  fileFilter,
  limits
});

// 获取文件URL
exports.getFileUrl = (req, filename) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
}; 