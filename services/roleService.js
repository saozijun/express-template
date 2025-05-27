const Role = require('../models/Role');
const User = require('../models/User');
const { Op } = require('sequelize');

/**
 * 角色业务逻辑层
 */

// 创建角色
exports.createRole = async (roleData) => {
  try {
    // 检查角色名称是否已存在
    const existingRole = await Role.findOne({ where: { name: roleData.name } });
    if (existingRole) {
      return {
        success: false,
        message: '角色名称已存在',
        statusCode: 400
      };
    }
    
    const role = await Role.create(roleData);
    
    return {
      success: true,
      data: role,
      statusCode: 200
    };
  } catch (error) {
    console.error('创建角色错误:', error);
    throw new Error(error.message);
  }
};

// 获取所有角色
exports.getAllRoles = async () => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });
    
    return {
      success: true,
      count: roles.length,
      data: roles
    };
  } catch (error) {
    console.error('获取角色列表错误:', error);
    throw new Error(error.message);
  }
};

// 获取角色分页列表
exports.getRolesPage = async (pageNum, pageSize, query = {}) => {
  try {
    // 处理模糊查询条件
    const whereClause = {};
    
    if (query.name) {
      whereClause.name = {
        [Op.like]: `%${query.name}%`
      };
    }
    
    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset: (pageNum - 1) * pageSize,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });
    
    return {
      success: true,
      data: {
        count,
        rows
      }
    };
  } catch (error) {
    console.error('获取角色分页列表错误:', error);
    throw new Error(error.message);
  }
};

// 获取单个角色
exports.getRoleById = async (roleId) => {
  try {
    const role = await Role.findByPk(roleId, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'username', 'email', 'avatar'],
          required: false
        }
      ]
    });
    
    if (!role) {
      return {
        success: false,
        message: '未找到角色',
        statusCode: 404
      };
    }
    
    return {
      success: true,
      data: role
    };
  } catch (error) {
    console.error(`获取角色(ID: ${roleId})错误:`, error);
    throw new Error(error.message);
  }
};

// 更新角色
exports.updateRole = async (roleId, updateData) => {
  try {
    const role = await Role.findByPk(roleId);
    
    if (!role) {
      return {
        success: false,
        message: '未找到角色',
        statusCode: 404
      };
    }
    
    // 如果要更新角色名称，检查是否已存在
    if (updateData.name && updateData.name !== role.name) {
      const existingRole = await Role.findOne({ where: { name: updateData.name } });
      if (existingRole) {
        return {
          success: false,
          message: '角色名称已存在',
          statusCode: 400
        };
      }
    }
    
    await role.update(updateData);
    
    return {
      success: true,
      data: role
    };
  } catch (error) {
    console.error(`更新角色(ID: ${roleId})错误:`, error);
    throw new Error(error.message);
  }
};

// 删除角色
exports.deleteRole = async (roleId) => {
  try {
    // 检查是否有用户使用此角色
    const usersWithRole = await User.count({ where: { roleId } });
    if (usersWithRole > 0) {
      return {
        success: false,
        message: '无法删除：该角色正在被用户使用',
        statusCode: 400
      };
    }
    
    const role = await Role.findByPk(roleId);
    
    if (!role) {
      return {
        success: false,
        message: '未找到角色',
        statusCode: 404
      };
    }
    
    await role.destroy();
    
    return {
      success: true,
      message: '角色删除成功'
    };
  } catch (error) {
    console.error(`删除角色(ID: ${roleId})错误:`, error);
    throw new Error(error.message);
  }
};

// 为用户分配角色
exports.assignRoleToUser = async (userId, roleId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        message: '未找到用户',
        statusCode: 404
      };
    }
    
    const role = await Role.findByPk(roleId);
    if (!role) {
      return {
        success: false,
        message: '未找到角色',
        statusCode: 404
      };
    }
    
    await user.update({ roleId });
    
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        role: {
          id: role.id,
          name: role.name
        }
      },
      message: '角色分配成功'
    };
  } catch (error) {
    console.error(`为用户分配角色错误:`, error);
    throw new Error(error.message);
  }
}; 