#!/bin/bash

# WayRumble 电商系统状态检查脚本
# 使用方法: chmod +x check-system.sh && ./check-system.sh

echo "🔍 WayRumble 电商系统状态检查"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 缺失${NC}"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 目录缺失${NC}"
        return 1
    fi
}

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 已安装${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 未安装${NC}"
        return 1
    fi
}

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 端口 $1 有服务运行${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  端口 $1 无服务${NC}"
        return 1
    fi
}

echo ""
echo "🔧 检查系统环境..."

# 检查必需软件
check_command "node"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   Node.js 版本: $NODE_VERSION"
fi

check_command "npm"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "   npm 版本: $NPM_VERSION"
fi

check_command "mongod" || check_command "docker"

echo ""
echo "📁 检查项目结构..."

# 检查主要目录
check_dir "backend"
check_dir "frontend"
check_dir "admin"

echo ""
echo "📄 检查配置文件..."

# 检查重要文件
check_file "package.json"
check_file "backend/package.json"
check_file "frontend/package.json"
check_file "admin/package.json"
check_file "backend/.env.example"
check_file "init-db.js"

echo ""
echo "⚙️ 检查环境配置..."

# 检查环境文件
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ backend/.env 已配置${NC}"
    
    # 检查关键配置项
    if grep -q "JWT_SECRET=your_super_secret_jwt_key_here" backend/.env; then
        echo -e "${YELLOW}⚠️  JWT_SECRET 使用默认值，建议修改${NC}"
    fi
    
    if grep -q "MONGODB_URI=" backend/.env; then
        echo -e "${GREEN}✅ MongoDB URI 已配置${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  backend/.env 未配置，将使用默认值${NC}"
fi

if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✅ frontend/.env 已配置${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/.env 未配置${NC}"
fi

if [ -f "admin/.env" ]; then
    echo -e "${GREEN}✅ admin/.env 已配置${NC}"
else
    echo -e "${YELLOW}⚠️  admin/.env 未配置${NC}"
fi

echo ""
echo "📦 检查依赖安装..."

# 检查依赖
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✅ 后端依赖已安装${NC}"
else
    echo -e "${RED}❌ 后端依赖未安装${NC}"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ 前端依赖已安装${NC}"
else
    echo -e "${RED}❌ 前端依赖未安装${NC}"
fi

if [ -d "admin/node_modules" ]; then
    echo -e "${GREEN}✅ 管理后台依赖已安装${NC}"
else
    echo -e "${RED}❌ 管理后台依赖未安装${NC}"
fi

echo ""
echo "🗄️ 检查数据库..."

# 检查 MongoDB
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✅ MongoDB 正在运行${NC}"
elif docker ps | grep -q "mongodb"; then
    echo -e "${GREEN}✅ MongoDB Docker 容器正在运行${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB 未运行${NC}"
fi

# 检查数据库连接
if command -v node &> /dev/null && [ -d "backend/node_modules" ]; then
    echo "检查数据库连接..."
    if node -e "
    const mongoose = require('./backend/node_modules/mongoose');
    mongoose.connect('mongodb://localhost:27017/wayrumble_ecommerce', {
      serverSelectionTimeoutMS: 3000
    })
    .then(() => {
      console.log('✅ 数据库连接成功');
      process.exit(0);
    })
    .catch(() => {
      console.log('❌ 数据库连接失败');
      process.exit(1);
    });
    " 2>/dev/null; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
    fi
fi

echo ""
echo "🌐 检查服务状态..."

# 检查服务端口
check_port 5000 && echo "   后端 API 服务"
check_port 3000 && echo "   前端服务"
check_port 3001 && echo "   管理后台服务"

echo ""
echo "📝 检查日志文件..."

# 检查日志
if [ -d "logs" ]; then
    echo -e "${GREEN}✅ 日志目录存在${NC}"
    
    if [ -f "logs/backend.log" ]; then
        BACKEND_LOG_SIZE=$(wc -l < logs/backend.log)
        echo "   后端日志: $BACKEND_LOG_SIZE 行"
    fi
    
    if [ -f "logs/frontend.log" ]; then
        FRONTEND_LOG_SIZE=$(wc -l < logs/frontend.log)
        echo "   前端日志: $FRONTEND_LOG_SIZE 行"
    fi
    
    if [ -f "logs/admin.log" ]; then
        ADMIN_LOG_SIZE=$(wc -l < logs/admin.log)
        echo "   管理后台日志: $ADMIN_LOG_SIZE 行"
    fi
else
    echo -e "${YELLOW}⚠️  日志目录不存在${NC}"
fi

echo ""
echo "🔧 检查启动脚本..."

# 检查脚本
check_file "quick-start.sh"
check_file "local-setup.sh"
check_file "stop-dev.sh"

echo ""
echo "📊 系统状态总结"
echo "=================="

# 计算就绪状态
READY_COUNT=0
TOTAL_COUNT=10

# 检查关键组件
[ -d "backend/node_modules" ] && ((READY_COUNT++))
[ -d "frontend/node_modules" ] && ((READY_COUNT++))
[ -d "admin/node_modules" ] && ((READY_COUNT++))
[ -f "backend/.env" ] && ((READY_COUNT++))
command -v node &> /dev/null && ((READY_COUNT++))
(command -v mongod &> /dev/null || command -v docker &> /dev/null) && ((READY_COUNT++))

# 检查服务状态
lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 && ((READY_COUNT++))
lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 && ((READY_COUNT++))
lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 && ((READY_COUNT++))

# 检查数据库
(pgrep -x "mongod" > /dev/null || docker ps | grep -q "mongodb") && ((READY_COUNT++))

READY_PERCENT=$((READY_COUNT * 100 / TOTAL_COUNT))

if [ $READY_PERCENT -ge 80 ]; then
    echo -e "${GREEN}🎉 系统状态良好 ($READY_COUNT/$TOTAL_COUNT)${NC}"
    echo ""
    echo "📱 访问地址:"
    echo "前端: http://localhost:3000"
    echo "管理后台: http://localhost:3001"
    echo "API: http://localhost:5000"
    echo ""
    echo "👤 测试账户:"
    echo "管理员: admin@wayrumble.com / admin123456"
    echo "用户: user@wayrumble.com / 123456"
elif [ $READY_PERCENT -ge 50 ]; then
    echo -e "${YELLOW}⚠️  系统部分就绪 ($READY_COUNT/$TOTAL_COUNT)${NC}"
    echo "建议运行: ./quick-start.sh"
else
    echo -e "${RED}❌ 系统未就绪 ($READY_COUNT/$TOTAL_COUNT)${NC}"
    echo "请运行: ./local-setup.sh"
fi

echo ""
echo "🛠️ 常用命令:"
echo "./quick-start.sh     - 快速启动系统"
echo "./local-setup.sh     - 完整设置和启动"
echo "./stop-dev.sh        - 停止所有服务"
echo "./check-system.sh    - 检查系统状态"
