# 🚀 WayRumble 电商系统 - 快速启动指南

## 📋 系统要求

- Node.js 16+ 
- MongoDB 4.4+
- npm 或 yarn

## ⚡ 快速启动（5分钟搞定）

### 1. 安装依赖
```bash
# 运行自动安装脚本
./setup.sh

# 或手动安装
npm run install:all
```

### 2. 启动 MongoDB
```bash
# 如果已安装 MongoDB
mongod

# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. 初始化数据库
```bash
node init-db.js
```

### 4. 启动开发环境
```bash
# 一键启动所有服务
./start-dev.sh

# 或使用 npm
npm run dev
```

## 🌐 访问地址

- **前端用户界面**: http://localhost:3000
- **管理后台**: http://localhost:3001  
- **后端API**: http://localhost:5000

## 👤 默认账户

### 管理员账户
- 邮箱: `admin@wayrumble.com`
- 密码: `admin123456`

### 测试用户
- 邮箱: `user@wayrumble.com`
- 密码: `123456`

## 🛠️ 主要功能

### 前端功能
- ✅ 产品浏览和搜索
- ✅ 购物车功能
- ✅ 用户注册/登录
- ✅ 产品定制
- ✅ 响应式设计

### 管理后台功能
- ✅ 产品管理（增删改查）
- ✅ 分类管理
- ✅ 订单管理
- ✅ 用户管理
- ✅ 数据统计

### 后端API功能
- ✅ RESTful API
- ✅ JWT 认证
- ✅ 文件上传
- ✅ 支付集成（Stripe）
- ✅ 数据验证

## 🔧 配置说明

### 环境变量配置

编辑 `backend/.env` 文件：

```env
# 数据库
MONGODB_URI=mongodb://localhost:27017/wayrumble_ecommerce

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary (图片存储)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (支付)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## 📁 项目结构

```
ecommerce-system/
├── backend/          # Node.js + Express 后端
├── frontend/         # React 前端
├── admin/           # React 管理后台
├── setup.sh         # 自动安装脚本
├── start-dev.sh     # 开发环境启动脚本
└── init-db.js       # 数据库初始化脚本
```

## 🐛 常见问题

### Q: 端口被占用怎么办？
A: 修改对应的端口配置或释放被占用的端口

### Q: MongoDB 连接失败？
A: 确保 MongoDB 服务正在运行，检查连接字符串

### Q: 图片上传失败？
A: 配置 Cloudinary 账户信息

### Q: 支付功能不工作？
A: 配置 Stripe 测试密钥

## 📚 详细文档

查看 [README.md](./README.md) 获取完整文档

## 🤝 获取帮助

- 查看日志文件: `logs/` 目录
- 检查控制台输出
- 确认所有依赖已正确安装

## 🎯 下一步

1. 浏览前端界面，体验购物流程
2. 登录管理后台，添加产品和分类
3. 配置支付和图片上传功能
4. 自定义样式和内容

祝您使用愉快！ 🎉
