const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取所有分类（树形结构）
router.get('/', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const query = includeInactive === 'true' ? {} : { isActive: true };
    
    const categories = await Category.find(query)
      .sort({ level: 1, order: 1, name: 1 })
      .lean();

    // 构建树形结构
    const categoryTree = buildCategoryTree(categories);

    res.json({
      categories: categoryTree,
      total: categories.length
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取扁平分类列表（用于管理后台）
router.get('/flat', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const query = includeInactive === 'true' ? {} : { isActive: true };
    
    const categories = await Category.find(query)
      .populate('parent', 'name')
      .sort({ level: 1, order: 1, name: 1 })
      .lean();

    res.json({
      categories,
      total: categories.length
    });
  } catch (error) {
    console.error('获取扁平分类列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个分类详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 支持通过ID或slug查询
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id }
      : { slug: id };

    const category = await Category.findOne(query)
      .populate('parent', 'name slug')
      .populate('children')
      .lean();

    if (!category) {
      return res.status(404).json({ message: '分类未找到' });
    }

    res.json({ category });
  } catch (error) {
    console.error('获取分类详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建分类（管理员）
router.post('/', requireAdmin, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('分类名称是必需的，且不能超过100个字符'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('分类描述不能超过500个字符'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('父分类ID格式无效'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('排序必须是非负整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { name, description, parent, order = 0, image, seo } = req.body;

    // 检查分类名称是否已存在
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: '分类名称已存在' });
    }

    let level = 0;
    
    // 如果有父分类，验证并计算层级
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: '父分类不存在' });
      }
      
      if (parentCategory.level >= 2) {
        return res.status(400).json({ message: '分类层级不能超过3级' });
      }
      
      level = parentCategory.level + 1;
    }

    const category = new Category({
      name,
      description,
      parent: parent || null,
      level,
      order,
      image,
      seo
    });

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('parent', 'name slug');

    res.status(201).json({
      message: '分类创建成功',
      category: populatedCategory
    });
  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新分类（管理员）
router.put('/:id', requireAdmin, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('分类名称不能超过100个字符'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('分类描述不能超过500个字符'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('父分类ID格式无效'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('排序必须是非负整数')
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

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: '分类未找到' });
    }

    // 如果更新名称，检查是否重复
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: updateData.name,
        _id: { $ne: id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: '分类名称已存在' });
      }
    }

    // 如果更新父分类
    if (updateData.parent !== undefined) {
      if (updateData.parent) {
        // 验证新父分类
        const parentCategory = await Category.findById(updateData.parent);
        if (!parentCategory) {
          return res.status(400).json({ message: '父分类不存在' });
        }

        // 检查是否会形成循环引用
        if (await isCircularReference(id, updateData.parent)) {
          return res.status(400).json({ message: '不能将分类设置为自己的子分类' });
        }

        updateData.level = parentCategory.level + 1;
      } else {
        updateData.level = 0;
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    res.json({
      message: '分类更新成功',
      category: updatedCategory
    });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除分类（管理员）
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: '分类未找到' });
    }

    // 使用文档中间件进行删除前检查
    await category.deleteOne();

    res.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类错误:', error);
    if (error.message.includes('无法删除')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 辅助函数：构建分类树
function buildCategoryTree(categories, parentId = null) {
  const tree = [];
  
  for (const category of categories) {
    if (String(category.parent) === String(parentId)) {
      const children = buildCategoryTree(categories, category._id);
      if (children.length > 0) {
        category.children = children;
      }
      tree.push(category);
    }
  }
  
  return tree;
}

// 辅助函数：检查循环引用
async function isCircularReference(categoryId, parentId) {
  if (categoryId === parentId) {
    return true;
  }
  
  const parent = await Category.findById(parentId);
  if (!parent || !parent.parent) {
    return false;
  }
  
  return await isCircularReference(categoryId, parent.parent);
}

module.exports = router;
