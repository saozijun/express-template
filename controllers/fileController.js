const fileService = require('../services/fileService');
const { success, error } = require('../utils/response');
const { getFileUrl } = require('../utils/fileUpload');
const path = require('path');

/**
 * 文件控制器
 */

// @desc    上传单个文件
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, '请选择要上传的文件', 400);
    }
    
    // 确定文件类型
    let fileType = 'other';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (
      req.file.mimetype === 'application/pdf' || 
      req.file.mimetype === 'application/msword' || 
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      fileType = 'document';
    }
    
    // 准备文件数据
    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`,
      fileType,
      userId: req.user.id,
      description: req.body.description || null
    };
    
    // 保存文件记录
    const result = await fileService.saveFile(fileData);
    
    if (!result.success) {
      return error(res, result.message, 500);
    }
    
    return success(res, result.data, '文件上传成功', 201);
  } catch (err) {
    console.error('文件上传失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    上传多个文件
// @route   POST /api/files/upload-multiple
// @access  Private
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return error(res, '请选择要上传的文件', 400);
    }
    
    const uploadedFiles = [];
    const errors = [];
    
    // 处理每个文件
    for (const file of req.files) {
      // 确定文件类型
      let fileType = 'other';
      if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (
        file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        fileType = 'document';
      }
      
      // 准备文件数据
      const fileData = {
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`,
        fileType,
        userId: req.user.id,
        description: req.body.description || null
      };
      
      try {
        // 保存文件记录
        const result = await fileService.saveFile(fileData);
        if (result.success) {
          uploadedFiles.push(result.data);
        } else {
          errors.push({
            file: file.originalname,
            error: result.message
          });
        }
      } catch (err) {
        errors.push({
          file: file.originalname,
          error: err.message
        });
      }
    }
    
    return success(res, { 
      files: uploadedFiles, 
      errors,
      total: req.files.length,
      successful: uploadedFiles.length,
      failed: errors.length
    }, '文件上传完成', 201);
  } catch (err) {
    console.error('文件上传失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取用户的所有文件
// @route   GET /api/files
// @access  Private
exports.getUserFiles = async (req, res) => {
  try {
    const fileType = req.query.type; // 可选的文件类型过滤
    const result = await fileService.getUserFiles(req.user.id, fileType);
    
    if (!result.success) {
      return error(res, result.message, 500);
    }
    
    return success(res, result.data, '获取文件列表成功');
  } catch (err) {
    console.error('获取文件列表失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取用户文件分页列表
// @route   GET /file/page
// @access  Private
exports.getFilesPage = async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 10, type, filename } = req.query;
    
    // 构建查询条件
    const query = { userId: req.user.id };
    if (type) query.fileType = type;
    if (filename) query.originalname = { $like: `%${filename}%` };
    
    const result = await fileService.getFilesPage(parseInt(pageNum), parseInt(pageSize), query);
    
    if (result.success) {
      return success(res, {
        records: result.data.rows,
        total: result.data.count,
        pageNum: parseInt(pageNum),
        pageSize: parseInt(pageSize)
      }, '获取文件分页列表成功', 200);
    } else {
      return error(res, result.message, 500);
    }
  } catch (err) {
    console.error('获取文件分页列表失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    获取单个文件
// @route   GET /api/files/:id
// @access  Private
exports.getFileById = async (req, res) => {
  try {
    const result = await fileService.getFileById(req.params.id);
    
    if (!result.success) {
      return error(res, result.message, 404);
    }
    
    // 检查是否是文件所有者
    if (result.data.userId !== req.user.id) {
      return error(res, '无权访问此文件', 403);
    }
    
    return success(res, result.data, '获取文件成功');
  } catch (err) {
    console.error('获取文件失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    删除文件
// @route   DELETE /api/files/:id
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const id = req.body.id || req.params.id;
    const result = await fileService.deleteFile(id, req.user.id);
    
    if (!result.success) {
      return error(res, result.message, 404);
    }
    
    return success(res, null, result.message);
  } catch (err) {
    console.error('删除文件失败:', err);
    return error(res, '服务器错误', 500);
  }
};

// @desc    更新文件信息
// @route   PUT /api/files/:id
// @access  Private
exports.updateFile = async (req, res) => {
  try {
    const id = req.body.id || req.params.id;
    const result = await fileService.updateFile(id, req.user.id, req.body);
    
    if (!result.success) {
      return error(res, result.message, 404);
    }
    
    return success(res, result.data, '文件信息更新成功');
  } catch (err) {
    console.error('更新文件失败:', err);
    return error(res, '服务器错误', 500);
  }
}; 