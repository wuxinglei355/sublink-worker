const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 获取产品列表（支持分页、搜索、筛选）
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('sort').optional().isIn(['newest', 'oldest', 'price_low', 'price_high', 'name_asc', 'name_desc', 'popular']).withMessage('排序方式无效'),
  query('category').optional().isMongoId().withMessage('分类ID格式无效'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('最低价格必须大于等于0'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('最高价格必须大于等于0'),
  query('inStock').optional().isBoolean().withMessage('库存筛选必须是布尔值')
], optionalAuth, async (req, res) => {
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
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      featured,
      inStock,
      tags
    } = req.query;

    // 构建查询条件
    const query = { status: 'active' };

    // 搜索
    if (search) {
      query.$text = { $search: search };
    }

    // 分类筛选
    if (category) {
      query.category = category;
    }

    // 价格筛选
    if (minPrice || maxPrice) {
      query['price.base'] = {};
      if (minPrice) query['price.base'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.base'].$lte = parseFloat(maxPrice);
    }

    // 特色产品筛选
    if (featured === 'true') {
      query.featured = true;
    }

    // 库存筛选
    if (inStock === 'true') {
      query.$or = [
        { 'inventory.trackInventory': false },
        { 'inventory.stock': { $gt: 0 } }
      ];
    }

    // 标签筛选
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // 排序
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'price_low':
        sortOption = { 'price.base': 1 };
        break;
      case 'price_high':
        sortOption = { 'price.base': -1 };
        break;
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      case 'name_desc':
        sortOption = { name: -1 };
        break;
      case 'popular':
        sortOption = { salesCount: -1, 'ratings.average': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // 如果有搜索，添加文本搜索评分排序
    if (search) {
      sortOption = { score: { $meta: 'textScore' }, ...sortOption };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 执行查询
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      },
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        sort,
        featured,
        inStock,
        tags
      }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个产品详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 支持通过ID或slug查询
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id, status: 'active' }
      : { 'seo.slug': id, status: 'active' };

    const product = await Product.findOne(query)
      .populate('category', 'name slug description')
      .lean();

    if (!product) {
      return res.status(404).json({ message: '产品未找到' });
    }

    // 获取相关产品（同分类的其他产品）
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      status: 'active'
    })
    .limit(4)
    .select('name images price ratings salesCount')
    .lean();

    res.json({
      product,
      relatedProducts
    });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建产品（管理员）
router.post('/', requireAdmin, [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('产品名称是必需的，且不能超过200个字符'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('产品描述是必需的，且不能超过2000个字符'),
  body('category').isMongoId().withMessage('分类ID格式无效'),
  body('price.base').isFloat({ min: 0 }).withMessage('基础价格必须大于等于0'),
  body('inventory.stock').optional().isInt({ min: 0 }).withMessage('库存必须大于等于0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    // 验证分类是否存在
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({ message: '指定的分类不存在' });
    }

    const product = new Product(req.body);
    await product.save();

    // 更新分类的产品数量
    await Category.findByIdAndUpdate(
      req.body.category,
      { $inc: { productCount: 1 } }
    );

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug');

    res.status(201).json({
      message: '产品创建成功',
      product: populatedProduct
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新产品（管理员）
router.put('/:id', requireAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('产品名称不能超过200个字符'),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('产品描述不能超过2000个字符'),
  body('category').optional().isMongoId().withMessage('分类ID格式无效'),
  body('price.base').optional().isFloat({ min: 0 }).withMessage('基础价格必须大于等于0'),
  body('inventory.stock').optional().isInt({ min: 0 }).withMessage('库存必须大于等于0')
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
    const updateData = req.body;

    // 如果更新分类，验证新分类是否存在
    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        return res.status(400).json({ message: '指定的分类不存在' });
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: '产品未找到' });
    }

    res.json({
      message: '产品更新成功',
      product
    });
  } catch (error) {
    console.error('更新产品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除产品（管理员）
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: '产品未找到' });
    }

    await Product.findByIdAndDelete(id);

    // 更新分类的产品数量
    await Category.findByIdAndUpdate(
      product.category,
      { $inc: { productCount: -1 } }
    );

    res.json({ message: '产品删除成功' });
  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
