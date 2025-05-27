/**
 * 统一响应工具
 * 用于封装API响应格式
 */

// 成功响应
exports.success = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data
  });
};

// 错误响应
exports.error = (res, message = '操作失败', statusCode = 500, errors = null) => {
  const responseBody = {
    success: false,
    code: statusCode,
    message
  };
  
  if (errors) {
    responseBody.errors = errors;
  }
  
  return res.status(statusCode).json(responseBody);
};

// 分页数据响应
exports.paginate = (res, data, count, page, limit) => {
  return res.status(200).json({
    success: true,
    code: 200,
    message: '获取成功',
    data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    }
  });
}; 