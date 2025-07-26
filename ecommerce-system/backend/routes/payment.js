const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const Order = require('../models/Order');

const router = express.Router();

// 创建支付意图
router.post('/create-intent', authenticate, [
  body('orderId').isMongoId().withMessage('订单ID格式无效'),
  body('paymentMethod').optional().isIn(['card', 'alipay', 'wechat_pay']).withMessage('支付方式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { orderId, paymentMethod = 'card' } = req.body;

    // 获取订单信息
    const order = await Order.findById(orderId).populate('user', 'email profile');
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 检查订单所有权
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权访问此订单' });
    }

    // 检查订单状态
    if (order.payment.status !== 'pending') {
      return res.status(400).json({ message: '订单支付状态不正确' });
    }

    // 创建 Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.pricing.total * 100), // Stripe 使用分为单位
      currency: 'usd',
      payment_method_types: [paymentMethod === 'card' ? 'card' : paymentMethod],
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        orderNumber: order.orderNumber
      },
      description: `WayRumble Order ${order.orderNumber}`,
      receipt_email: order.user.email,
      shipping: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        address: {
          line1: order.shippingAddress.address1,
          line2: order.shippingAddress.address2 || '',
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postal_code: order.shippingAddress.zipCode,
          country: order.shippingAddress.country
        }
      }
    });

    // 更新订单支付信息
    order.payment.transactionId = paymentIntent.id;
    order.payment.method = 'stripe';
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.pricing.total,
      currency: 'usd'
    });
  } catch (error) {
    console.error('创建支付意图错误:', error);
    res.status(500).json({ message: '创建支付失败' });
  }
});

// 确认支付
router.post('/confirm', authenticate, [
  body('paymentIntentId').notEmpty().withMessage('支付意图ID是必需的')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { paymentIntentId } = req.body;

    // 从 Stripe 获取支付意图
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({ message: '支付意图未找到' });
    }

    // 获取订单
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 检查订单所有权
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权访问此订单' });
    }

    // 更新订单支付状态
    if (paymentIntent.status === 'succeeded') {
      order.payment.status = 'completed';
      order.payment.paidAt = new Date();
      order.status = 'confirmed';
      
      // 添加到时间线
      order.timeline.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: '支付成功，订单已确认'
      });
    } else if (paymentIntent.status === 'payment_failed') {
      order.payment.status = 'failed';
    } else {
      order.payment.status = 'processing';
    }

    await order.save();

    res.json({
      message: '支付状态更新成功',
      paymentStatus: paymentIntent.status,
      orderStatus: order.status
    });
  } catch (error) {
    console.error('确认支付错误:', error);
    res.status(500).json({ message: '确认支付失败' });
  }
});

// Stripe Webhook 处理
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook 签名验证失败:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // 处理事件
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object);
        break;
      
      default:
        console.log(`未处理的事件类型: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook 处理错误:', error);
    res.status(500).json({ error: 'Webhook 处理失败' });
  }
});

// 处理支付成功
async function handlePaymentSucceeded(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  const order = await Order.findById(orderId);
  if (!order) {
    console.error('订单未找到:', orderId);
    return;
  }

  if (order.payment.status !== 'completed') {
    order.payment.status = 'completed';
    order.payment.paidAt = new Date();
    order.status = 'confirmed';
    
    order.timeline.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: '支付成功，订单已确认'
    });

    await order.save();
    
    // 这里可以添加发送确认邮件的逻辑
    console.log(`订单 ${order.orderNumber} 支付成功`);
  }
}

// 处理支付失败
async function handlePaymentFailed(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  const order = await Order.findById(orderId);
  if (!order) {
    console.error('订单未找到:', orderId);
    return;
  }

  order.payment.status = 'failed';
  
  order.timeline.push({
    status: order.status,
    timestamp: new Date(),
    note: '支付失败'
  });

  await order.save();
  
  console.log(`订单 ${order.orderNumber} 支付失败`);
}

// 处理争议
async function handleChargeDispute(charge) {
  const paymentIntentId = charge.payment_intent;
  
  // 查找相关订单
  const order = await Order.findOne({ 'payment.transactionId': paymentIntentId });
  if (!order) {
    console.error('争议相关订单未找到:', paymentIntentId);
    return;
  }

  order.timeline.push({
    status: order.status,
    timestamp: new Date(),
    note: '支付争议已创建'
  });

  await order.save();
  
  console.log(`订单 ${order.orderNumber} 发生支付争议`);
}

// 获取支付方式
router.get('/methods', authenticate, async (req, res) => {
  try {
    // 返回支持的支付方式
    const paymentMethods = [
      {
        id: 'card',
        name: '信用卡/借记卡',
        description: '支持 Visa、MasterCard、American Express',
        icon: '💳',
        enabled: true
      },
      {
        id: 'alipay',
        name: '支付宝',
        description: '使用支付宝安全支付',
        icon: '🅰️',
        enabled: false // 需要在 Stripe 中启用
      },
      {
        id: 'wechat_pay',
        name: '微信支付',
        description: '使用微信支付',
        icon: '💬',
        enabled: false // 需要在 Stripe 中启用
      }
    ];

    res.json({ paymentMethods });
  } catch (error) {
    console.error('获取支付方式错误:', error);
    res.status(500).json({ message: '获取支付方式失败' });
  }
});

// 退款
router.post('/refund', authenticate, [
  body('orderId').isMongoId().withMessage('订单ID格式无效'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('退款金额必须大于0'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('退款原因不能超过500个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { orderId, amount, reason } = req.body;

    // 获取订单
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 检查权限（管理员或订单所有者）
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && 
        order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权操作此订单' });
    }

    // 检查支付状态
    if (order.payment.status !== 'completed') {
      return res.status(400).json({ message: '订单未支付或支付未完成' });
    }

    // 计算退款金额
    const refundAmount = amount || order.pricing.total;
    
    if (refundAmount > order.pricing.total) {
      return res.status(400).json({ message: '退款金额不能超过订单总额' });
    }

    // 创建 Stripe 退款
    const refund = await stripe.refunds.create({
      payment_intent: order.payment.transactionId,
      amount: Math.round(refundAmount * 100), // 转换为分
      reason: 'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        reason: reason || '客户申请退款'
      }
    });

    // 更新订单状态
    order.payment.status = 'refunded';
    order.payment.refundedAt = new Date();
    order.payment.refundAmount = refundAmount;
    order.status = 'refunded';
    
    order.timeline.push({
      status: 'refunded',
      timestamp: new Date(),
      note: `退款 $${refundAmount}${reason ? ` - ${reason}` : ''}`,
      updatedBy: req.user._id
    });

    await order.save();

    res.json({
      message: '退款成功',
      refundId: refund.id,
      refundAmount,
      order
    });
  } catch (error) {
    console.error('退款错误:', error);
    res.status(500).json({ message: '退款失败' });
  }
});

module.exports = router;
