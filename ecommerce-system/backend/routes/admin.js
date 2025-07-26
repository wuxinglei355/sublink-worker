const express = require('express');
const { query, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');

const router = express.Router();

// 获取仪表板统计数据
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // 计算日期范围
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 并行执行多个统计查询
    const [
      // 基础统计
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      
      // 时期统计
      newUsers,
      newOrders,
      periodRevenue,
      
      // 订单状态统计
      ordersByStatus,
      
      // 最近订单
      recentOrders,
      
      // 热销产品
      topProducts,
      
      // 收入趋势
      revenueTrend
    ] = await Promise.all([
      // 基础统计
      User.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      
      // 时期统计
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      Order.aggregate([
        { 
          $match: { 
            'payment.status': 'completed',
            createdAt: { $gte: startDate }
          } 
        },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      
      // 订单状态统计
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // 最近订单
      Order.find()
        .populate('user', 'email profile')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // 热销产品
      Product.find({ status: 'active' })
        .sort({ salesCount: -1 })
        .limit(5)
        .select('name images price salesCount')
        .lean(),
      
      // 收入趋势（按天）
      Order.aggregate([
        {
          $match: {
            'payment.status': 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    // 格式化数据
    const overview = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      newUsers,
      newOrders,
      periodRevenue: periodRevenue[0]?.total || 0,
      averageOrderValue: newOrders > 0 ? (periodRevenue[0]?.total || 0) / newOrders : 0
    };

    const orderStatusStats = ordersByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // 格式化收入趋势数据
    const revenueChartData = revenueTrend.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      revenue: item.revenue,
      orders: item.orders
    }));

    res.json({
      overview,
      orderStats: {
        pending: orderStatusStats.pending || 0,
        confirmed: orderStatusStats.confirmed || 0,
        processing: orderStatusStats.processing || 0,
        shipped: orderStatusStats.shipped || 0,
        delivered: orderStatusStats.delivered || 0,
        cancelled: orderStatusStats.cancelled || 0,
        refunded: orderStatusStats.refunded || 0
      },
      recentOrders: recentOrders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.user.profile.fullName,
        email: order.user.email,
        total: order.pricing.total,
        status: order.status,
        createdAt: order.createdAt
      })),
      topProducts: topProducts.map(product => ({
        id: product._id,
        name: product.name,
        image: product.primaryImage,
        price: product.price.sale || product.price.base,
        salesCount: product.salesCount
      })),
      revenueChart: revenueChartData,
      period
    });
  } catch (error) {
    console.error('获取仪表板数据错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取销售统计
router.get('/sales/stats', requireAdmin, [
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('分组方式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '查询参数验证失败',
        errors: errors.array()
      });
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // 构建日期查询条件
    const dateQuery = { 'payment.status': 'completed' };
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    // 构建分组管道
    let groupStage;
    switch (groupBy) {
      case 'week':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          }
        };
        break;
      case 'month':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          }
        };
        break;
      default: // day
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          }
        };
    }

    const salesData = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          ...groupStage,
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // 获取产品销售统计
    const productSales = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      salesData,
      productSales,
      groupBy,
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('获取销售统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取库存警报
router.get('/inventory/alerts', requireAdmin, async (req, res) => {
  try {
    // 获取低库存产品
    const lowStockProducts = await Product.find({
      status: 'active',
      'inventory.trackInventory': true,
      $expr: {
        $lte: ['$inventory.stock', '$inventory.lowStockThreshold']
      }
    })
    .select('name images inventory category')
    .populate('category', 'name')
    .lean();

    // 获取缺货产品
    const outOfStockProducts = await Product.find({
      status: 'active',
      'inventory.trackInventory': true,
      'inventory.stock': 0
    })
    .select('name images inventory category')
    .populate('category', 'name')
    .lean();

    res.json({
      lowStockProducts: lowStockProducts.map(product => ({
        id: product._id,
        name: product.name,
        image: product.primaryImage,
        category: product.category.name,
        currentStock: product.inventory.stock,
        threshold: product.inventory.lowStockThreshold
      })),
      outOfStockProducts: outOfStockProducts.map(product => ({
        id: product._id,
        name: product.name,
        image: product.primaryImage,
        category: product.category.name
      })),
      alerts: {
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length
      }
    });
  } catch (error) {
    console.error('获取库存警报错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取系统活动日志
router.get('/activity', requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('type').optional().isIn(['order', 'product', 'user', 'system']).withMessage('活动类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '查询参数验证失败',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 这里应该从专门的活动日志表中获取数据
    // 暂时从订单时间线中获取一些活动数据
    const activities = await Order.aggregate([
      { $unwind: '$timeline' },
      {
        $lookup: {
          from: 'users',
          localField: 'timeline.updatedBy',
          foreignField: '_id',
          as: 'updatedBy'
        }
      },
      {
        $project: {
          type: 'order',
          action: '$timeline.status',
          description: '$timeline.note',
          timestamp: '$timeline.timestamp',
          orderId: '$_id',
          orderNumber: '$orderNumber',
          updatedBy: { $arrayElemAt: ['$updatedBy', 0] }
        }
      },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const total = await Order.aggregate([
      { $unwind: '$timeline' },
      { $count: 'total' }
    ]);

    res.json({
      activities: activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        timestamp: activity.timestamp,
        relatedId: activity.orderId,
        relatedNumber: activity.orderNumber,
        user: activity.updatedBy ? {
          name: activity.updatedBy.profile?.fullName || '系统',
          email: activity.updatedBy.email
        } : { name: '系统', email: null }
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((total[0]?.total || 0) / parseInt(limit)),
        totalActivities: total[0]?.total || 0,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取活动日志错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
