var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 数据库连接
const { connectDB } = require('./config/db');
const initDB = require('./config/init-db');

// 错误处理中间件
const errorHandler = require('./middleware/errorHandler');

// 连接数据库
connectDB();
// 初始化数据库表
initDB();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var filesRouter = require('./routes/files');
var rolesRouter = require('./routes/roles');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 为上传的文件提供静态服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 设置CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

// 路由
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/auth', authRouter);
app.use('/file', filesRouter);
app.use('/role', rolesRouter);

// 兼容旧路由
app.use('/users', usersRouter);
app.use('/files', filesRouter);
app.use('/roles', rolesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// 全局错误处理
app.use(errorHandler);
module.exports = app;
