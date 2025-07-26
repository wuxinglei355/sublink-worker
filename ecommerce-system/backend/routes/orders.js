const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticate, requireAdmin, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// 获取订单列表
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('订单状态无效')
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
      limit = 10,
      status,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件
    const query = {};
    
    // 非管理员只能查看自己的订单
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      query.user = req.user._id;
    }

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 日期筛选
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 执行查询
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'email profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个订单详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('user', 'email profile')
      .populate('items.product', 'name images')
      .lean();

    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 检查权限：用户只能查看自己的订单
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && 
        order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权访问此订单' });
    }

    res.json({ order });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建订单
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }).withMessage('订单必须包含至少一个商品'),
  body('items.*.product').isMongoId().withMessage('商品ID格式无效'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('商品数量必须大于0'),
  body('shippingAddress.firstName').trim().notEmpty().withMessage('收货人姓名是必需的'),
  body('shippingAddress.address1').trim().notEmpty().withMessage('收货地址是必需的'),
  body('shippingAddress.city').trim().notEmpty().withMessage('城市是必需的'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('邮编是必需的'),
  body('shippingAddress.country').trim().notEmpty().withMessage('国家是必需的')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { items, shippingAddress, billingAddress, notes } = req.body;

    // 验证商品并计算价格
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          message: `商品 ${item.product} 不存在` 
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({ 
          message: `商品 ${product.name} 已下架` 
        });
      }

      // 检查库存
      if (product.inventory.trackInventory && product.inventory.stock < item.quantity) {
        return res.status(400).json({ 
          message: `商品 ${product.name} 库存不足` 
        });
      }

      const price = product.price.sale || product.price.base;
      const itemSubtotal = price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.primaryImage,
        price,
        quantity: item.quantity,
        variants: item.variants || [],
        customization: item.customization || null,
        subtotal: itemSubtotal
      });

      subtotal += itemSubtotal;
    }

    // 计算税费和运费
    const tax = subtotal * 0.08; // 8% 税率
    const shipping = subtotal > 50 ? 0 : 9.99; // 满$50免运费
    const total = subtotal + tax + shipping;

    // 创建订单
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      pricing: {
        subtotal,
        tax,
        shipping,
        total
      },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes: {
        customer: notes
      }
    });

    await order.save();

    // 更新商品库存和销量
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          'inventory.stock': -item.quantity,
          salesCount: item.quantity
        }
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'email profile')
      .populate('items.product', 'name images');

    res.status(201).json({
      message: '订单创建成功',
      order: populatedOrder
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新订单状态（管理员）
router.put('/:id/status', requireAdmin, [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('订单状态无效'),
  body('note').optional().trim().isLength({ max: 500 }).withMessage('备注不能超过500个字符')
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
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 更新订单状态
    order.status = status;
    
    // 添加管理员备注
    if (note) {
      order.notes.admin = note;
    }

    // 添加到时间线
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `订单状态更新为: ${status}`,
      updatedBy: req.user._id
    });

    // 根据状态更新相关字段
    if (status === 'shipped') {
      order.shipping.shippedAt = new Date();
    } else if (status === 'delivered') {
      order.shipping.deliveredAt = new Date();
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'email profile')
      .populate('items.product', 'name images');

    res.json({
      message: '订单状态更新成功',
      order: updatedOrder
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消订单
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 检查权限
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && 
        order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权取消此订单' });
    }

    // 检查订单状态
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: '订单状态不允许取消' });
    }

    // 更新订单状态
    order.status = 'cancelled';
    order.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: '订单已取消',
      updatedBy: req.user._id
    });

    await order.save();

    // 恢复商品库存
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          'inventory.stock': item.quantity,
          salesCount: -item.quantity
        }
      });
    }

    res.json({
      message: '订单取消成功',
      order
    });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
