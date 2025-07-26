# 🧪 WayRumble 电商系统本地测试指南

## 🚀 快速启动

### 1. 一键启动（推荐）
```bash
cd ecommerce-system
./local-setup.sh
```

这个脚本会自动：
- ✅ 检查系统环境
- ✅ 启动 MongoDB
- ✅ 安装所有依赖
- ✅ 配置环境变量
- ✅ 初始化数据库
- ✅ 启动所有服务

### 2. 手动启动
如果自动脚本有问题，可以手动启动：

```bash
# 1. 启动 MongoDB
mongod
# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 2. 安装依赖
npm run install:all

# 3. 配置环境变量
cp backend/.env.example backend/.env

# 4. 初始化数据库
node init-db.js

# 5. 启动服务
npm run dev
```

## 🌐 访问地址

启动成功后，您可以访问：

- **前端用户界面**: http://localhost:3000
- **管理后台**: http://localhost:3001
- **后端API**: http://localhost:5000

## 👤 测试账户

系统已预置以下测试账户：

### 管理员账户
- **邮箱**: admin@wayrumble.com
- **密码**: admin123456
- **权限**: 完整管理权限

### 普通用户账户
- **邮箱**: user@wayrumble.com
- **密码**: 123456
- **权限**: 普通用户权限

## 🧪 功能测试清单

### 前端用户功能测试

#### 1. 用户认证测试
- [ ] 用户注册功能
- [ ] 用户登录功能
- [ ] 密码重置功能
- [ ] 个人资料更新

#### 2. 产品浏览测试
- [ ] 首页产品展示
- [ ] 产品列表页面
- [ ] 产品搜索功能
- [ ] 产品筛选功能
- [ ] 产品详情页面
- [ ] 产品图片查看

#### 3. 购物车测试
- [ ] 添加商品到购物车
- [ ] 修改商品数量
- [ ] 删除购物车商品
- [ ] 购物车侧边栏
- [ ] 购物车页面

#### 4. 结账流程测试
- [ ] 配送地址填写
- [ ] 支付信息填写
- [ ] 订单确认
- [ ] 支付处理（测试模式）

#### 5. 订单管理测试
- [ ] 查看订单历史
- [ ] 订单详情查看
- [ ] 订单状态跟踪

### 管理后台功能测试

#### 1. 管理员登录
- [ ] 管理员登录功能
- [ ] 权限验证

#### 2. 仪表板测试
- [ ] 销售数据统计
- [ ] 订单状态分布
- [ ] 收入趋势图表
- [ ] 热销产品排行

#### 3. 产品管理测试
- [ ] 产品列表查看
- [ ] 添加新产品
- [ ] 编辑产品信息
- [ ] 删除产品
- [ ] 产品状态管理
- [ ] 图片上传功能

#### 4. 分类管理测试
- [ ] 分类列表查看
- [ ] 添加新分类
- [ ] 编辑分类信息
- [ ] 删除分类

#### 5. 订单管理测试
- [ ] 订单列表查看
- [ ] 订单详情查看
- [ ] 订单状态更新
- [ ] 订单搜索筛选

#### 6. 用户管理测试
- [ ] 用户列表查看
- [ ] 用户状态管理
- [ ] 用户角色管理

## 🔧 常见问题排查

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001
lsof -i :5000

# 杀死占用进程
kill -9 <PID>
```

### 2. MongoDB 连接失败
```bash
# 检查 MongoDB 状态
mongod --version
ps aux | grep mongod

# 启动 MongoDB
mongod

# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. 依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 4. 前端编译错误
```bash
# 检查 Node.js 版本
node --version  # 需要 16+

# 清理构建缓存
rm -rf build
npm start
```

### 5. 后端启动失败
```bash
# 检查环境变量
cat backend/.env

# 检查数据库连接
node -e "
const mongoose = require('./backend/node_modules/mongoose');
mongoose.connect('mongodb://localhost:27017/wayrumble_ecommerce')
  .then(() => console.log('数据库连接成功'))
  .catch(err => console.error('数据库连接失败:', err));
"
```

## 📝 测试数据

系统已预置以下测试数据：

### 产品分类
- 画布印刷
- 马克杯
- 装饰品
- 项链
- 服装
- 毯子

### 示例产品
- 耶稣风景画布印刷
- 家庭定制马克杯

### 测试订单
系统会自动生成一些测试订单数据

## 🎯 性能测试

### 1. 页面加载速度
- 首页加载时间 < 3秒
- 产品列表加载时间 < 2秒
- 产品详情加载时间 < 2秒

### 2. API 响应时间
- 登录接口 < 1秒
- 产品列表接口 < 1秒
- 订单创建接口 < 2秒

### 3. 并发测试
可以使用工具如 Apache Bench 进行简单的并发测试：
```bash
# 测试首页
ab -n 100 -c 10 http://localhost:3000/

# 测试 API
ab -n 100 -c 10 http://localhost:5000/api/products
```

## 🔒 安全测试

### 1. 认证测试
- [ ] 未登录用户无法访问受保护页面
- [ ] JWT 令牌过期处理
- [ ] 密码强度验证

### 2. 权限测试
- [ ] 普通用户无法访问管理后台
- [ ] API 权限验证

### 3. 输入验证测试
- [ ] SQL 注入防护
- [ ] XSS 攻击防护
- [ ] 文件上传安全

## 📱 响应式测试

测试不同设备尺寸：
- [ ] 手机端 (320px - 768px)
- [ ] 平板端 (768px - 1024px)
- [ ] 桌面端 (1024px+)

## 🛠️ 开发工具

### 1. 浏览器开发者工具
- Network 面板查看 API 请求
- Console 面板查看错误信息
- Application 面板查看本地存储

### 2. 数据库工具
```bash
# MongoDB 命令行
mongo wayrumble_ecommerce

# 查看集合
show collections

# 查看用户数据
db.users.find().pretty()

# 查看产品数据
db.products.find().pretty()
```

### 3. 日志查看
```bash
# 查看实时日志
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/admin.log
```

## 🚀 部署前检查

在部署到生产环境前，确保：

- [ ] 所有测试用例通过
- [ ] 没有控制台错误
- [ ] 性能指标达标
- [ ] 安全测试通过
- [ ] 响应式设计正常
- [ ] 环境变量配置正确
- [ ] 数据库备份策略
- [ ] SSL 证书配置
- [ ] 域名解析设置

## 📞 获取帮助

如果遇到问题：

1. 查看日志文件 (`logs/` 目录)
2. 检查控制台错误信息
3. 确认所有依赖已正确安装
4. 验证环境变量配置
5. 重启所有服务

祝您测试愉快！🎉
