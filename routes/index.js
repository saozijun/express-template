var express = require('express');
var router = express.Router();
const { success } = require('../utils/response');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express API' });
});

/* API 状态检查 */
router.get('/api/status', function(req, res) {
  const statusData = {
    version: '1.0.0',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  return success(res, statusData, 'API 服务运行正常');
});

module.exports = router;
