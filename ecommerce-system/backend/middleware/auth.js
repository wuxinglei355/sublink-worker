const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT令牌
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '访问被拒绝，未提供令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: '令牌无效，用户不存在' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    if (user.isLocked) {
      return res.status(401).json({ message: '账户已被锁定，请稍后再试' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '令牌无效' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期' });
    }
    console.error('认证错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 可选认证（用户可能已登录也可能未登录）
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active' && !user.isLocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next();
  }
};

// 检查用户角色
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '访问被拒绝，需要登录' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '访问被拒绝，权限不足' });
    }

    next();
  };
};

// 检查是否为管理员
const requireAdmin = authorize('admin', 'super_admin');

// 检查是否为超级管理员
const requireSuperAdmin = authorize('super_admin');

// 检查资源所有权（用户只能访问自己的资源）
const checkOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '访问被拒绝，需要登录' });
    }

    // 管理员可以访问所有资源
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }

    // 检查资源所有权
    const resourceUserId = req.params.userId || req.body[resourceField] || req.query[resourceField];
    
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '访问被拒绝，只能访问自己的资源' });
    }

    next();
  };
};

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// 验证令牌（不查询数据库）
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireAdmin,
  requireSuperAdmin,
  checkOwnership,
  generateToken,
  verifyToken
};
