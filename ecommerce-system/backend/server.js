const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// 安全中间件
app.use(helmet());
app.use(compression());

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// CORS配置
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001'
  ],
  credentials: true
}));

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 数据库连接
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 连接成功');
})
.catch((error) => {
  console.error('❌ MongoDB 连接失败:', error);
  process.exit(1);
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// 404处理
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API路由未找到' });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: '数据验证失败',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ message: '无效的ID格式' });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({ message: '数据已存在' });
  }
  
  res.status(error.status || 500).json({
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📱 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`⚙️  管理后台: ${process.env.ADMIN_URL || 'http://localhost:3001'}`);
});
