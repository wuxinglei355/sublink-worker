#!/bin/bash

# WayRumble 电商系统开发环境启动脚本
# 使用方法: chmod +x start-dev.sh && ./start-dev.sh

echo "🚀 启动 WayRumble 电商系统开发环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 MongoDB
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB 未运行"
    echo "请启动 MongoDB 或使用 Docker:"
    echo "docker run -d -p 27017:27017 --name mongodb mongo:latest"
    read -p "MongoDB 已启动？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $1 已被占用"
        return 1
    fi
    return 0
}

echo "🔍 检查端口..."
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

# 检查环境配置文件
if [ ! -f "backend/.env" ]; then
    echo "⚠️  后端环境配置文件不存在，正在创建..."
    cp backend/.env.example backend/.env
    echo "✅ 已创建 backend/.env，请根据需要修改配置"
fi

# 检查依赖是否已安装
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "admin/node_modules" ]; then
    echo "📦 安装管理后台依赖..."
    cd admin && npm install && cd ..
fi

# 创建日志目录
mkdir -p logs

echo "🚀 启动所有服务..."

# 启动后端服务
echo "启动后端服务 (端口 5000)..."
cd backend && npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端服务
echo "启动前端服务 (端口 3000)..."
cd frontend && BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 启动管理后台
echo "启动管理后台 (端口 3001)..."
cd admin && BROWSER=none npm start > ../logs/admin.log 2>&1 &
ADMIN_PID=$!
cd ..

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

echo ""
echo "🎉 所有服务已启动！"
echo ""
echo "📱 前端用户界面: http://localhost:3000"
echo "⚙️  管理后台: http://localhost:3001"
echo "🔌 后端API: http://localhost:5000"
echo ""
echo "📋 默认账户:"
echo "管理员: admin@wayrumble.com / admin123456"
echo "用户: user@wayrumble.com / 123456"
echo ""
echo "📝 日志文件:"
echo "后端: logs/backend.log"
echo "前端: logs/frontend.log"
echo "管理后台: logs/admin.log"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 创建停止函数
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."
    kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null
    echo "✅ 所有服务已停止"
    exit 0
}

# 捕获中断信号
trap cleanup INT TERM

# 等待用户中断
wait
