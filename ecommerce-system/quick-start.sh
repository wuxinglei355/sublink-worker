#!/bin/bash

# WayRumble 电商系统快速启动脚本
# 使用方法: chmod +x quick-start.sh && ./quick-start.sh

echo "🚀 WayRumble 电商系统快速启动"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js 16+"
    echo "访问: https://nodejs.org/"
    exit 1
fi

# 检查 MongoDB 或 Docker
MONGODB_OK=0
if command -v mongod &> /dev/null; then
    echo "✅ 找到 MongoDB"
    MONGODB_OK=1
elif command -v docker &> /dev/null; then
    echo "✅ 找到 Docker，将使用 Docker 启动 MongoDB"
    MONGODB_OK=1
else
    echo "❌ 请安装 MongoDB 或 Docker"
    echo "MongoDB: https://www.mongodb.com/try/download/community"
    echo "Docker: https://www.docker.com/get-started"
    exit 1
fi

# 启动 MongoDB
echo "🗄️ 启动 MongoDB..."
if command -v mongod &> /dev/null && ! pgrep -x "mongod" > /dev/null; then
    mongod --fork --logpath /tmp/mongodb.log 2>/dev/null || mongod &
    sleep 3
elif command -v docker &> /dev/null; then
    if ! docker ps | grep -q "mongodb-wayrumble"; then
        docker run -d --name mongodb-wayrumble -p 27017:27017 mongo:latest
        sleep 5
    fi
fi

# 安装依赖
echo "📦 安装依赖..."
if [ ! -d "backend/node_modules" ]; then
    echo "安装后端依赖..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "admin/node_modules" ]; then
    echo "安装管理后台依赖..."
    cd admin && npm install && cd ..
fi

# 配置环境变量
echo "⚙️ 配置环境..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ 创建后端环境配置"
fi

if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
EOF
    echo "✅ 创建前端环境配置"
fi

if [ ! -f "admin/.env" ]; then
    cat > admin/.env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
EOF
    echo "✅ 创建管理后台环境配置"
fi

# 初始化数据库
echo "🗄️ 初始化数据库..."
node init-db.js

# 创建日志目录
mkdir -p logs

echo "🚀 启动服务..."

# 启动后端
echo "启动后端服务..."
cd backend && npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 5

# 启动前端
echo "启动前端服务..."
cd frontend && BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 启动管理后台
echo "启动管理后台..."
cd admin && BROWSER=none npm start > ../logs/admin.log 2>&1 &
ADMIN_PID=$!
cd ..

# 保存进程ID
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid
echo $ADMIN_PID > logs/admin.pid

echo ""
echo "🎉 启动完成！"
echo ""
echo "📱 访问地址:"
echo "前端: http://localhost:3000"
echo "管理后台: http://localhost:3001"
echo "API: http://localhost:5000"
echo ""
echo "👤 测试账户:"
echo "管理员: admin@wayrumble.com / admin123456"
echo "用户: user@wayrumble.com / 123456"
echo ""
echo "🛑 停止服务: ./stop-dev.sh"
echo ""

# 创建停止脚本
cat > stop-dev.sh << 'EOF'
#!/bin/bash
echo "🛑 停止服务..."

if [ -f "logs/backend.pid" ]; then
    kill $(cat logs/backend.pid) 2>/dev/null
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null
    rm -f logs/frontend.pid
fi

if [ -f "logs/admin.pid" ]; then
    kill $(cat logs/admin.pid) 2>/dev/null
    rm -f logs/admin.pid
fi

pkill -f "react-scripts start" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

echo "✅ 服务已停止"
EOF

chmod +x stop-dev.sh

echo "按 Ctrl+C 停止所有服务..."

# 等待中断信号
trap './stop-dev.sh; exit 0' INT TERM

while true; do
    sleep 1
done
