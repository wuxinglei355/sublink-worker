# 🚀 WayRumble 电商系统部署指南

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+
- **内存**: 最少 2GB RAM (推荐 4GB+)
- **存储**: 最少 20GB 可用空间
- **CPU**: 最少 1 核心 (推荐 2 核心+)

### 2. 必需软件
- Node.js 16+
- MongoDB 4.4+
- Nginx
- PM2 (进程管理)
- SSL 证书 (Let's Encrypt)

## 🛠️ 服务器环境配置

### 1. 更新系统
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 安装 Node.js
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 安装 MongoDB
```bash
# 导入 MongoDB 公钥
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# 添加 MongoDB 仓库
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 安装 MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动并启用 MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4. 安装 Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. 安装 PM2
```bash
sudo npm install -g pm2
```

## 📦 项目部署

### 1. 克隆项目
```bash
cd /var/www
sudo git clone <your-repository-url> wayrumble
sudo chown -R $USER:$USER /var/www/wayrumble
cd wayrumble
```

### 2. 安装依赖
```bash
# 后端依赖
cd backend
npm install --production
cd ..

# 前端依赖并构建
cd frontend
npm install
npm run build
cd ..

# 管理后台依赖并构建
cd admin
npm install
npm run build
cd ..
```

### 3. 配置环境变量
```bash
# 复制并编辑后端环境配置
cp backend/.env.example backend/.env
nano backend/.env
```

编辑 `backend/.env`:
```env
# 生产环境配置
NODE_ENV=production
PORT=5000

# 数据库
MONGODB_URI=mongodb://localhost:27017/wayrumble_production

# JWT (生成强密钥)
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# 前端URL
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. 初始化数据库
```bash
node init-db.js
```

### 5. 配置 PM2
创建 `ecosystem.config.js`:
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'wayrumble-backend',
      script: './backend/server.js',
      cwd: '/var/www/wayrumble',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
EOF
```

### 6. 启动后端服务
```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

## 🌐 Nginx 配置

### 1. 创建主站点配置
```bash
sudo nano /etc/nginx/sites-available/wayrumble
```

添加配置:
```nginx
# 主网站配置
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # 前端静态文件
    root /var/www/wayrumble/frontend/build;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 管理后台配置
server {
    listen 80;
    server_name admin.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # 管理后台静态文件
    root /var/www/wayrumble/admin/build;
    index index.html;
    
    # 基本认证 (可选)
    # auth_basic "Admin Area";
    # auth_basic_user_file /etc/nginx/.htpasswd;
    
    # API 代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 管理后台路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 2. 启用站点
```bash
sudo ln -s /etc/nginx/sites-available/wayrumble /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL 证书配置

### 1. 安装 Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. 获取 SSL 证书
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d admin.yourdomain.com
```

### 3. 设置自动续期
```bash
sudo crontab -e
```

添加:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔥 防火墙配置

```bash
# 启用 UFW
sudo ufw enable

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 27017  # MongoDB (仅限本地)

# 查看状态
sudo ufw status
```

## 📊 监控和日志

### 1. 查看应用状态
```bash
pm2 status
pm2 logs wayrumble-backend
```

### 2. 查看 Nginx 日志
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. 查看系统资源
```bash
pm2 monit
```

## 🔄 更新部署

创建更新脚本 `update.sh`:
```bash
#!/bin/bash
echo "🔄 更新 WayRumble 系统..."

# 拉取最新代码
git pull origin main

# 更新后端
cd backend
npm install --production
cd ..

# 重新构建前端
cd frontend
npm install
npm run build
cd ..

# 重新构建管理后台
cd admin
npm install
npm run build
cd ..

# 重启后端服务
pm2 restart wayrumble-backend

# 重新加载 Nginx
sudo systemctl reload nginx

echo "✅ 更新完成！"
```

```bash
chmod +x update.sh
```

## 🛡️ 安全建议

1. **定期更新系统和依赖**
2. **使用强密码和密钥**
3. **启用防火墙**
4. **定期备份数据库**
5. **监控系统日志**
6. **使用 HTTPS**
7. **限制管理后台访问**

## 📋 备份策略

### 1. 数据库备份
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db wayrumble_production --out /var/backups/mongodb/$DATE
tar -czf /var/backups/mongodb/backup_$DATE.tar.gz /var/backups/mongodb/$DATE
rm -rf /var/backups/mongodb/$DATE
# 保留最近30天的备份
find /var/backups/mongodb -name "backup_*.tar.gz" -mtime +30 -delete
EOF

chmod +x backup.sh
```

### 2. 设置定时备份
```bash
sudo crontab -e
```

添加:
```bash
0 2 * * * /var/www/wayrumble/backup.sh
```

## 🎯 性能优化

1. **启用 Gzip 压缩**
2. **配置静态文件缓存**
3. **使用 CDN**
4. **优化数据库查询**
5. **启用 PM2 集群模式**
6. **配置 Redis 缓存** (可选)

部署完成后，您的网站将在以下地址可用:
- 主网站: https://yourdomain.com
- 管理后台: https://admin.yourdomain.com
