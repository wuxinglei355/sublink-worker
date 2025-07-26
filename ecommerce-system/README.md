# 🛍️ WayRumble 电商系统

一个现代化的全栈电商解决方案，包含用户前端、管理后台和强大的后端API。

## ⚡ 快速开始

### 🚀 一键启动（推荐）
```bash
cd ecommerce-system
chmod +x quick-start.sh
./quick-start.sh
```

### 🔧 完整安装
```bash
chmod +x local-setup.sh
./local-setup.sh
```

### 📊 检查系统状态
```bash
chmod +x check-system.sh
./check-system.sh
```

## 🌐 访问地址

- **前端用户界面**: http://localhost:3000
- **管理后台**: http://localhost:3001
- **后端API**: http://localhost:5000

## 👤 测试账户

- **管理员**: admin@wayrumble.com / admin123456
- **用户**: user@wayrumble.com / 123456

## 🚀 功能特性

### 前端用户界面
- 🛍️ 产品浏览和搜索
- 🎨 产品定制功能
- 🛒 购物车和结账流程
- 👤 用户注册和登录
- 📱 响应式设计
- 💳 支付集成（Stripe）

### 管理后台
- 📊 销售数据仪表板
- 📦 产品管理（增删改查）
- 🏷️ 分类管理
- 📋 订单管理
- 👥 用户管理
- ⚙️ 系统设置

### 后端API
- 🔐 JWT认证
- 📝 RESTful API
- 🗄️ MongoDB数据库
- 📁 文件上传（Cloudinary）
- 💰 支付处理（Stripe）
- 📧 邮件通知

## 🛠️ 技术栈

### 前端
- React 18
- React Router
- Tailwind CSS
- Zustand (状态管理)
- React Query (数据获取)
- Framer Motion (动画)

### 后端
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT认证
- Multer (文件上传)
- Stripe (支付)

### 管理后台
- React 18
- React Table
- Recharts (图表)
- React Hook Form

## 📋 环境要求

- Node.js 16+
- MongoDB 4.4+
- npm 或 yarn

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd ecommerce-system
```

### 2. 安装依赖
```bash
# 安装所有依赖
npm run install:all

# 或者分别安装
npm install                    # 根目录
cd backend && npm install      # 后端
cd ../frontend && npm install  # 前端
cd ../admin && npm install     # 管理后台
```

### 3. 环境配置

#### 后端配置
复制 `backend/.env.example` 到 `backend/.env` 并配置以下变量：

```env
# 数据库
MONGODB_URI=mongodb://localhost:27017/wayrumble_ecommerce

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# 服务器
PORT=5000
NODE_ENV=development

# Cloudinary (图片存储)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (支付)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# 前端URL
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

#### 前端配置
在 `frontend` 目录创建 `.env` 文件：

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

#### 管理后台配置
在 `admin` 目录创建 `.env` 文件：

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. 启动数据库
确保 MongoDB 正在运行：

```bash
# 使用 MongoDB Community Edition
mongod

# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. 启动应用

#### 开发模式（推荐）
```bash
# 同时启动所有服务
npm run dev
```

这将启动：
- 后端API: http://localhost:5000
- 前端: http://localhost:3000
- 管理后台: http://localhost:3001

#### 分别启动
```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm start

# 管理后台
cd admin && npm start
```

### 6. 创建管理员账户

访问 http://localhost:3001 并注册一个账户，然后在数据库中将该用户的 `role` 字段更改为 `admin`：

```javascript
// 在 MongoDB shell 中执行
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## 📁 项目结构

```
ecommerce-system/
├── backend/                 # 后端API
│   ├── controllers/         # 控制器
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── middleware/         # 中间件
│   └── server.js           # 服务器入口
├── frontend/               # 前端用户界面
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── store/          # 状态管理
│   │   └── services/       # API服务
│   └── public/             # 静态资源
├── admin/                  # 管理后台
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   └── services/       # API服务
│   └── public/             # 静态资源
└── package.json            # 根配置文件
```

## 🔧 开发指南

### API文档
后端API遵循RESTful设计原则：

- `GET /api/products` - 获取产品列表
- `POST /api/products` - 创建产品
- `PUT /api/products/:id` - 更新产品
- `DELETE /api/products/:id` - 删除产品

### 数据库模型
主要数据模型包括：
- User (用户)
- Product (产品)
- Category (分类)
- Order (订单)

### 状态管理
使用 Zustand 进行状态管理：
- `useAuthStore` - 用户认证状态
- `useCartStore` - 购物车状态

## 🚀 部署

### 生产环境构建
```bash
# 构建前端和管理后台
npm run build

# 启动生产服务器
npm start
```

### Docker 部署
```bash
# 构建镜像
docker build -t wayrumble-ecommerce .

# 运行容器
docker run -p 5000:5000 wayrumble-ecommerce
```

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您有任何问题或需要帮助，请：

1. 查看 [常见问题](docs/FAQ.md)
2. 创建 [Issue](../../issues)
3. 联系开发团队

## 🎯 路线图

- [ ] 多语言支持
- [ ] 移动端应用
- [ ] 高级分析功能
- [ ] 库存管理
- [ ] 优惠券系统
- [ ] 评论和评分系统
