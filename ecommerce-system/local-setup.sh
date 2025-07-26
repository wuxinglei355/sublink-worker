#!/bin/bash

# WayRumble 电商系统本地开发环境完整设置脚本
# 使用方法: chmod +x local-setup.sh && ./local-setup.sh

echo "🚀 WayRumble 电商系统本地开发环境设置"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 已安装${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 未安装${NC}"
        return 1
    fi
}

# 检查端口函数
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  端口 $1 已被占用${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 端口 $1 可用${NC}"
        return 0
    fi
}

echo ""
echo "🔍 检查系统环境..."

# 检查必需软件
MISSING_DEPS=0

if ! check_command "node"; then
    echo -e "${RED}请安装 Node.js 16+ 版本${NC}"
    echo "访问: https://nodejs.org/"
    MISSING_DEPS=1
fi

if ! check_command "npm"; then
    echo -e "${RED}npm 未找到，请确保 Node.js 正确安装${NC}"
    MISSING_DEPS=1
fi

if ! check_command "mongod"; then
    echo -e "${YELLOW}MongoDB 未安装，将尝试使用 Docker 启动${NC}"
    if ! check_command "docker"; then
        echo -e "${RED}Docker 也未安装，请安装 MongoDB 或 Docker${NC}"
        echo "MongoDB: https://www.mongodb.com/try/download/community"
        echo "Docker: https://www.docker.com/get-started"
        MISSING_DEPS=1
    fi
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "${RED}❌ 缺少必需的依赖，请安装后重新运行${NC}"
    exit 1
fi

echo ""
echo "🔍 检查端口可用性..."

# 检查端口
PORTS_OK=1
if ! check_port 5000; then
    echo "请释放端口 5000 或修改后端配置"
    PORTS_OK=0
fi

if ! check_port 3000; then
    echo "请释放端口 3000 或修改前端配置"
    PORTS_OK=0
fi

if ! check_port 3001; then
    echo "请释放端口 3001 或修改管理后台配置"
    PORTS_OK=0
fi

if [ $PORTS_OK -eq 0 ]; then
    read -p "是否继续？某些端口被占用可能导致启动失败 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🗄️ 启动 MongoDB..."

# 启动 MongoDB
MONGODB_STARTED=0
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo -e "${GREEN}✅ MongoDB 已在运行${NC}"
        MONGODB_STARTED=1
    else
        echo "启动 MongoDB..."
        mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data 2>/dev/null || {
            echo "使用默认配置启动 MongoDB..."
            mongod &
            sleep 3
        }
        MONGODB_STARTED=1
    fi
elif command -v docker &> /dev/null; then
    echo "使用 Docker 启动 MongoDB..."
    if docker ps | grep -q "mongodb-wayrumble"; then
        echo -e "${GREEN}✅ MongoDB Docker 容器已在运行${NC}"
    else
        docker run -d --name mongodb-wayrumble -p 27017:27017 mongo:latest
        echo "等待 MongoDB 启动..."
        sleep 5
    fi
    MONGODB_STARTED=1
fi

if [ $MONGODB_STARTED -eq 0 ]; then
    echo -e "${RED}❌ 无法启动 MongoDB${NC}"
    exit 1
fi

echo ""
echo "📦 安装项目依赖..."

# 检查并安装依赖
install_deps() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        echo "安装 $name 依赖..."
        cd "$dir"
        if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
            npm install
            if [ $? -ne 0 ]; then
                echo -e "${RED}❌ $name 依赖安装失败${NC}"
                return 1
            fi
        else
            echo -e "${GREEN}✅ $name 依赖已是最新${NC}"
        fi
        cd - > /dev/null
    else
        echo -e "${YELLOW}⚠️  $dir 目录不存在${NC}"
        return 1
    fi
}

# 安装根目录依赖
if [ -f "package.json" ]; then
    echo "安装根目录依赖..."
    npm install
fi

# 安装各模块依赖
install_deps "backend" "后端"
install_deps "frontend" "前端"
install_deps "admin" "管理后台"

echo ""
echo "⚙️ 配置环境变量..."

# 创建后端环境配置
if [ ! -f "backend/.env" ]; then
    echo "创建后端环境配置..."
    cp backend/.env.example backend/.env
    
    # 生成随机 JWT 密钥
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "wayrumble_jwt_secret_$(date +%s)")
    
    # 更新配置文件
    if command -v sed &> /dev/null; then
        sed -i.bak "s/your_super_secret_jwt_key_here/$JWT_SECRET/g" backend/.env
        rm -f backend/.env.bak
    fi
    
    echo -e "${GREEN}✅ 已创建 backend/.env${NC}"
else
    echo -e "${GREEN}✅ backend/.env 已存在${NC}"
fi

# 创建前端环境配置
if [ ! -f "frontend/.env" ]; then
    echo "创建前端环境配置..."
    cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
GENERATE_SOURCEMAP=false
EOF
    echo -e "${GREEN}✅ 已创建 frontend/.env${NC}"
else
    echo -e "${GREEN}✅ frontend/.env 已存在${NC}"
fi

# 创建管理后台环境配置
if [ ! -f "admin/.env" ]; then
    echo "创建管理后台环境配置..."
    cat > admin/.env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
EOF
    echo -e "${GREEN}✅ 已创建 admin/.env${NC}"
else
    echo -e "${GREEN}✅ admin/.env 已存在${NC}"
fi

echo ""
echo "🗄️ 初始化数据库..."

# 检查数据库是否已初始化
if node -e "
const mongoose = require('./backend/node_modules/mongoose');
mongoose.connect('mongodb://localhost:27017/wayrumble_ecommerce')
  .then(() => mongoose.connection.db.collection('users').countDocuments())
  .then(count => {
    console.log(count > 0 ? 'EXISTS' : 'EMPTY');
    process.exit(0);
  })
  .catch(() => {
    console.log('EMPTY');
    process.exit(0);
  });
" 2>/dev/null | grep -q "EXISTS"; then
    echo -e "${GREEN}✅ 数据库已初始化${NC}"
else
    echo "初始化数据库数据..."
    if node init-db.js; then
        echo -e "${GREEN}✅ 数据库初始化成功${NC}"
    else
        echo -e "${YELLOW}⚠️  数据库初始化失败，但可以继续${NC}"
    fi
fi

echo ""
echo "🚀 启动开发服务器..."

# 创建日志目录
mkdir -p logs

# 启动函数
start_service() {
    local dir=$1
    local name=$2
    local port=$3
    local cmd=$4
    local log_file="logs/${name}.log"
    
    echo "启动 $name (端口 $port)..."
    cd "$dir"
    
    # 清理旧的日志
    > "../$log_file"
    
    # 启动服务
    if [ "$name" = "backend" ]; then
        npm run dev > "../$log_file" 2>&1 &
    else
        BROWSER=none npm start > "../$log_file" 2>&1 &
    fi
    
    local pid=$!
    echo $pid > "../logs/${name}.pid"
    cd - > /dev/null
    
    # 等待服务启动
    echo "等待 $name 启动..."
    for i in {1..30}; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name 启动成功${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${YELLOW}⚠️  $name 启动可能需要更多时间${NC}"
    return 0
}

# 启动后端
start_service "backend" "backend" "5000"

# 等待后端完全启动
sleep 5

# 启动前端
start_service "frontend" "frontend" "3000"

# 启动管理后台
start_service "admin" "admin" "3001"

echo ""
echo -e "${GREEN}🎉 WayRumble 电商系统启动完成！${NC}"
echo ""
echo "📱 访问地址:"
echo -e "${BLUE}前端用户界面: http://localhost:3000${NC}"
echo -e "${BLUE}管理后台: http://localhost:3001${NC}"
echo -e "${BLUE}后端API: http://localhost:5000${NC}"
echo ""
echo "👤 默认账户:"
echo "管理员: admin@wayrumble.com / admin123456"
echo "测试用户: user@wayrumble.com / 123456"
echo ""
echo "📝 日志文件:"
echo "后端: logs/backend.log"
echo "前端: logs/frontend.log"
echo "管理后台: logs/admin.log"
echo ""
echo "🛑 停止服务:"
echo "运行: ./stop-dev.sh"
echo "或按 Ctrl+C 然后运行停止脚本"
echo ""

# 创建停止脚本
cat > stop-dev.sh << 'EOF'
#!/bin/bash
echo "🛑 停止 WayRumble 开发服务器..."

# 停止所有服务
if [ -f "logs/backend.pid" ]; then
    kill $(cat logs/backend.pid) 2>/dev/null
    rm -f logs/backend.pid
    echo "✅ 后端服务已停止"
fi

if [ -f "logs/frontend.pid" ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null
    rm -f logs/frontend.pid
    echo "✅ 前端服务已停止"
fi

if [ -f "logs/admin.pid" ]; then
    kill $(cat logs/admin.pid) 2>/dev/null
    rm -f logs/admin.pid
    echo "✅ 管理后台服务已停止"
fi

# 停止可能的其他相关进程
pkill -f "react-scripts start" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

echo "🎉 所有服务已停止"
EOF

chmod +x stop-dev.sh

# 等待用户操作
echo "按 Ctrl+C 停止所有服务..."

# 捕获中断信号
trap './stop-dev.sh; exit 0' INT TERM

# 保持脚本运行
while true; do
    sleep 1
done
