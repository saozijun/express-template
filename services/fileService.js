const File = require('../models/File');
const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');

/**
 * 文件业务逻辑层
 */

// 保存文件记录到数据库
exports.saveFile = async (fileData) => {
  try {
    const file = await File.create(fileData);
    
    return {
      success: true,
      data: file
    };
  } catch (error) {
    console.error('保存文件记录错误:', error);
    throw new Error(error.message);
  }
};

// 获取用户的所有文件
exports.getUserFiles = async (userId, fileType = null) => {
  try {
    const query = {
      where: { userId }
    };
    
    // 如果指定了文件类型，添加到查询条件
    if (fileType) {
      query.where.fileType = fileType;
    }
    
    const files = await File.findAll(query);
    
    return {
      success: true,
      count: files.length,
      data: files
    };
  } catch (error) {
    console.error(`获取用户(ID: ${userId})文件错误:`, error);
    throw new Error(error.message);
  }
};

// 获取文件分页列表
exports.getFilesPage = async (pageNum, pageSize, query = {}) => {
  try {
    // 处理模糊查询条件
    const whereClause = { ...query };
    
    // 处理文件名模糊查询
    if (query.originalname && query.originalname.$like) {
      whereClause.originalname = {
        [Op.like]: query.originalname.$like
      };
    }
    
    const { count, rows } = await File.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset: (pageNum - 1) * pageSize,
      order: [['createdAt', 'DESC']]
    });
    
    return {
      success: true,
      data: {
        count,
        rows
      }
    };
  } catch (error) {
    console.error('获取文件分页列表错误:', error);
    throw new Error(error.message);
  }
};

// 获取单个文件
exports.getFileById = async (fileId) => {
  try {
    const file = await File.findByPk(fileId);
    
    if (!file) {
      return {
        success: false,
        message: '未找到文件'
      };
    }
    
    return {
      success: true,
      data: file
    };
  } catch (error) {
    console.error(`获取文件(ID: ${fileId})错误:`, error);
    throw new Error(error.message);
  }
};

// 删除文件
exports.deleteFile = async (fileId, userId) => {
  try {
    const file = await File.findOne({
      where: {
        id: fileId,
        userId
      }
    });
    
    if (!file) {
      return {
        success: false,
        message: '未找到文件或无权限删除'
      };
    }
    
    // 从文件系统中删除
    try {
      await fs.unlink(file.path);
    } catch (err) {
      console.error('删除物理文件错误:', err);
      // 即使物理文件删除失败，也继续删除数据库记录
    }
    
    // 从数据库中删除记录
    await file.destroy();
    
    return {
      success: true,
      message: '文件删除成功'
    };
  } catch (error) {
    console.error(`删除文件(ID: ${fileId})错误:`, error);
    throw new Error(error.message);
  }
};

// 更新文件信息
exports.updateFile = async (fileId, userId, updateData) => {
  try {
    const file = await File.findOne({
      where: {
        id: fileId,
        userId
      }
    });
    
    if (!file) {
      return {
        success: false,
        message: '未找到文件或无权限更新'
      };
    }
    
    // 只允许更新某些字段
    const allowedFields = ['description'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });
    
    await file.update(filteredData);
    
    return {
      success: true,
      data: file
    };
  } catch (error) {
    console.error(`更新文件(ID: ${fileId})错误:`, error);
    throw new Error(error.message);
  }
}; 