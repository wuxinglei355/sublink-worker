const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '分类名称是必需的'],
    trim: true,
    unique: true,
    maxlength: [100, '分类名称不能超过100个字符']
  },
  description: {
    type: String,
    maxlength: [500, '分类描述不能超过500个字符']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  image: {
    url: String,
    alt: String
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 3 // 最多3级分类
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：获取子分类
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// 虚拟字段：获取产品
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// 索引
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, order: 1 });
categorySchema.index({ isActive: 1, level: 1 });

// 中间件：保存前生成slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// 中间件：删除前检查是否有子分类或产品
categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // 检查是否有子分类
    const childCount = await this.constructor.countDocuments({ parent: this._id });
    if (childCount > 0) {
      throw new Error('无法删除包含子分类的分类');
    }

    // 检查是否有产品
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ category: this._id });
    if (productCount > 0) {
      throw new Error('无法删除包含产品的分类');
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Category', categorySchema);
