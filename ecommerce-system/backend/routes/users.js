const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取用户列表（管理员）
router.get('/', requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('role').optional().isIn(['customer', 'admin', 'super_admin']).withMessage('用户角色无效'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('用户状态无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '查询参数验证失败',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};

    // 搜索
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // 角色筛选
    if (role) {
      query.role = role;
    }

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 排序
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 执行查询
    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password')
        .lean(),
      User.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      },
      filters: {
        search,
        role,
        status,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个用户详情（管理员）
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    res.json({ user });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户状态（管理员）
router.put('/:id/status', requireAdmin, [
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('用户状态无效'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('原因不能超过500个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    // 防止修改超级管理员状态
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: '无权修改超级管理员状态' });
    }

    // 防止用户修改自己的状态
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: '不能修改自己的状态' });
    }

    user.status = status;
    await user.save();

    res.json({
      message: '用户状态更新成功',
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户角色（超级管理员）
router.put('/:id/role', authenticate, [
  body('role').isIn(['customer', 'admin', 'super_admin']).withMessage('用户角色无效')
], async (req, res) => {
  try {
    // 只有超级管理员可以修改用户角色
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: '只有超级管理员可以修改用户角色' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    // 防止用户修改自己的角色
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: '不能修改自己的角色' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: '用户角色更新成功',
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除用户（超级管理员）
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // 只有超级管理员可以删除用户
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: '只有超级管理员可以删除用户' });
    }

    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    // 防止删除自己
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: '不能删除自己的账户' });
    }

    // 防止删除其他超级管理员
    if (user.role === 'super_admin') {
      return res.status(400).json({ message: '不能删除超级管理员账户' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户统计信息（管理员）
router.get('/stats/overview', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 构建日期查询条件
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    // 并行执行多个统计查询
    const [
      totalUsers,
      activeUsers,
      newUsers,
      usersByRole,
      usersByStatus,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments(dateQuery),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('email profile createdAt status role')
        .lean()
    ]);

    // 格式化统计数据
    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const statusStats = usersByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        newUsers,
        inactiveUsers: totalUsers - activeUsers
      },
      roleDistribution: {
        customer: roleStats.customer || 0,
        admin: roleStats.admin || 0,
        super_admin: roleStats.super_admin || 0
      },
      statusDistribution: {
        active: statusStats.active || 0,
        inactive: statusStats.inactive || 0,
        suspended: statusStats.suspended || 0
      },
      recentUsers
    });
  } catch (error) {
    console.error('获取用户统计信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
