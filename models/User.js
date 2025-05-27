const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db');
const Role = require('./Role');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: '请提供用户名' },
      len: {
        args: [2, 50],
        msg: '用户名长度必须在2-50个字符之间'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: { 
        args: true,
        msg: '请提供有效的邮箱' 
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '请提供密码' },
      len: {
        args: [6, 100],
        msg: '密码长度必须至少为6个字符'
      }
    }
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '/uploads/avatars/default.png'
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^1[3-9]\d{9}$/,
        msg: '请提供有效的手机号码'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    allowNull: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 实例方法 - 生成JWT Token
User.prototype.getSignedJwtToken = function() {
  return jwt.sign({ id: this.id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// 实例方法 - 比较密码
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 建立用户与角色的关联关系
User.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role'
});

Role.hasMany(User, {
  foreignKey: 'roleId',
  as: 'users'
});

module.exports = User; 