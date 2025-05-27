# Express API 框架

这是一个基于Express.js的API框架，包含用户认证、MySQL数据库连接等基础功能。

## 功能特点

- 用户注册与登录
- JWT认证
- MySQL数据库集成
- RESTful API设计
- 密码加密存储
- 中间件保护路由

## 安装与配置

### 前置条件

- Node.js (v14+)
- MySQL

### 安装步骤

1. 克隆项目
```
git clone <项目地址>
cd express
```

2. 安装依赖
```
npm install
```

3. 配置环境变量
创建.env文件，参考.env.example文件配置以下内容：
```
DB_NAME=express_app
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

4. 创建MySQL数据库
```
CREATE DATABASE express_app;
```

5. 启动服务
```
npm run dev
```

## API文档

### 认证相关

#### 注册用户
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "用户名",
    "email": "邮箱@example.com",
    "password": "密码"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN"
  }
  ```

#### 用户登录
- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "email": "邮箱@example.com",
    "password": "密码"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN"
  }
  ```

#### 获取当前用户信息
- **URL**: `/api/auth/me`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer JWT_TOKEN`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "用户ID",
      "username": "用户名",
      "email": "邮箱@example.com",
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

### 用户相关

#### 获取所有用户
- **URL**: `/users`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer JWT_TOKEN`
- **成功响应**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "id": "用户ID",
        "username": "用户名",
        "email": "邮箱@example.com",
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ]
  }
  ```

#### 获取单个用户
- **URL**: `/users/:id`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer JWT_TOKEN`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "用户ID",
      "username": "用户名",
      "email": "邮箱@example.com",
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 更新用户信息
- **URL**: `/users/:id`
- **方法**: `PUT`
- **请求头**: `Authorization: Bearer JWT_TOKEN`
- **请求体**:
  ```json
  {
    "username": "新用户名",
    "email": "新邮箱@example.com"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "用户ID",
      "username": "新用户名",
      "email": "新邮箱@example.com",
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

## 开发

### 运行开发环境
```
npm run dev
```

### 运行生产环境
```
npm start
``` 