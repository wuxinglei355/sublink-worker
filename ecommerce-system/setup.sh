#!/bin/bash

# WayRumble 电商系统安装脚本
# 使用方法: chmod +x setup.sh && ./setup.sh

echo "🚀 开始安装 WayRumble 电商系统..."

# 检查 Node.js 是否已安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 16+ 版本"
    echo "访问 https://nodejs.org/ 下载安装"
    exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 版本过低，需要 16+ 版本，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查 MongoDB 是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB 未运行，请确保 MongoDB 已启动"
    echo "如果未安装 MongoDB，请访问 https://www.mongodb.com/try/download/community"
    echo "或使用 Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    read -p "MongoDB 已启动？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "请启动 MongoDB 后重新运行此脚本"
        exit 1
    fi
fi

echo "✅ MongoDB 检查通过"

# 安装根目录依赖
echo "📦 安装根目录依赖..."
npm install

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
npm install
cd ..

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
npm install
cd ..

# 安装管理后台依赖
echo "📦 安装管理后台依赖..."
cd admin
npm install
cd ..

# 创建环境配置文件
echo "⚙️  创建环境配置文件..."

# 后端环境配置
if [ ! -f "backend/.env" ]; then
    echo "创建后端环境配置文件..."
    cp backend/.env.example backend/.env
    echo "✅ 已创建 backend/.env，请根据需要修改配置"
else
    echo "⚠️  backend/.env 已存在，跳过创建"
fi

# 前端环境配置
if [ ! -f "frontend/.env" ]; then
    echo "创建前端环境配置文件..."
    cat > frontend/.env << EOL
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
EOL
    echo "✅ 已创建 frontend/.env"
else
    echo "⚠️  frontend/.env 已存在，跳过创建"
fi

# 管理后台环境配置
if [ ! -f "admin/.env" ]; then
    echo "创建管理后台环境配置文件..."
    cat > admin/.env << EOL
REACT_APP_API_URL=http://localhost:5000/api
EOL
    echo "✅ 已创建 admin/.env"
else
    echo "⚠️  admin/.env 已存在，跳过创建"
fi

# 创建启动脚本
echo "📝 创建启动脚本..."
cat > start.sh << 'EOL'
#!/bin/bash

echo "🚀 启动 WayRumble 电商系统..."

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  端口 $1 已被占用"
        return 1
    fi
    return 0
}

# 检查必要端口
if ! check_port 5000; then
    echo "请释放端口 5000 或修改后端配置"
    exit 1
fi

if ! check_port 3000; then
    echo "请释放端口 3000 或修改前端配置"
    exit 1
fi

if ! check_port 3001; then
    echo "请释放端口 3001 或修改管理后台配置"
    exit 1
fi

echo "✅ 端口检查通过"

# 启动所有服务
echo "启动后端服务..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "启动前端服务..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo "启动管理后台..."
cd ../admin && npm start &
ADMIN_PID=$!

cd ..

echo ""
echo "🎉 所有服务已启动！"
echo ""
echo "📱 前端用户界面: http://localhost:3000"
echo "⚙️  管理后台: http://localhost:3001"
echo "🔌 后端API: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止所有服务..."; kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null; exit 0' INT

wait
EOL

chmod +x start.sh

# 创建数据库初始化脚本
echo "📝 创建数据库初始化脚本..."
cat > init-db.js << 'EOL'
// MongoDB 数据库初始化脚本
// 使用方法: node init-db.js

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/models/User');
const Category = require('./backend/models/Category');

async function initDatabase() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 创建默认分类
    const categories = [
      { name: '画布印刷', slug: 'canvas', description: '高品质画布印刷产品' },
      { name: '马克杯', slug: 'mug', description: '个性化马克杯定制' },
      { name: '装饰品', slug: 'ornament', description: '精美装饰品系列' },
      { name: '项链', slug: 'necklace', description: '定制项链首饰' },
      { name: '服装', slug: 'apparel', description: '个性化服装定制' },
      { name: '毯子', slug: 'blanket', description: '温暖舒适的定制毯子' },
    ];

    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      if (!existingCategory) {
        await Category.create(categoryData);
        console.log(`✅ 创建分类: ${categoryData.name}`);
      }
    }

    // 创建管理员账户
    const adminEmail = 'admin@wayrumble.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: 'admin123456',
        profile: {
          firstName: '管理员',
          lastName: '账户'
        },
        role: 'admin',
        emailVerified: true
      });
      console.log('✅ 创建管理员账户');
      console.log('📧 邮箱: admin@wayrumble.com');
      console.log('🔑 密码: admin123456');
    } else {
      console.log('⚠️  管理员账户已存在');
    }

    console.log('🎉 数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();
EOL

echo ""
echo "🎉 安装完成！"
echo ""
echo "📋 下一步操作："
echo "1. 配置环境变量 (编辑 backend/.env 文件)"
echo "2. 初始化数据库: node init-db.js"
echo "3. 启动系统: ./start.sh"
echo ""
echo "📚 详细文档请查看 README.md"
echo ""
echo "🔧 重要配置项："
echo "- MongoDB 连接字符串"
echo "- JWT 密钥"
echo "- Cloudinary 配置 (图片上传)"
echo "- Stripe 配置 (支付功能)"
echo ""
echo "✨ 祝您使用愉快！"
