const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '产品名称是必需的'],
    trim: true,
    maxlength: [200, '产品名称不能超过200个字符']
  },
  description: {
    type: String,
    required: [true, '产品描述是必需的'],
    maxlength: [2000, '产品描述不能超过2000个字符']
  },
  shortDescription: {
    type: String,
    maxlength: [500, '简短描述不能超过500个字符']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '产品分类是必需的']
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  price: {
    base: {
      type: Number,
      required: [true, '基础价格是必需的'],
      min: [0, '价格不能为负数']
    },
    sale: {
      type: Number,
      min: [0, '折扣价格不能为负数']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'CNY', 'EUR']
    }
  },
  variants: [{
    name: {
      type: String,
      required: true // 例如: "尺寸", "颜色"
    },
    options: [{
      value: String, // 例如: "12x16", "红色"
      priceModifier: {
        type: Number,
        default: 0 // 价格调整，可以是正数或负数
      },
      stock: {
        type: Number,
        default: 0,
        min: 0
      }
    }]
  }],
  customization: {
    allowText: {
      type: Boolean,
      default: false
    },
    allowImage: {
      type: Boolean,
      default: false
    },
    textOptions: {
      maxLength: {
        type: Number,
        default: 100
      },
      fonts: [String],
      colors: [String]
    },
    imageOptions: {
      maxSize: {
        type: Number,
        default: 5242880 // 5MB
      },
      allowedFormats: {
        type: [String],
        default: ['jpg', 'jpeg', 'png', 'webp']
      }
    }
  },
  inventory: {
    stock: {
      type: Number,
      required: true,
      min: [0, '库存不能为负数'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackInventory: {
      type: Boolean,
      default: true
    }
  },
  shipping: {
    weight: {
      type: Number,
      default: 0 // 重量(克)
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'heavy', 'fragile', 'digital'],
      default: 'standard'
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  salesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：计算折扣百分比
productSchema.virtual('discountPercentage').get(function() {
  if (this.price.sale && this.price.base > this.price.sale) {
    return Math.round(((this.price.base - this.price.sale) / this.price.base) * 100);
  }
  return 0;
});

// 虚拟字段：获取主图片
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// 虚拟字段：检查是否有库存
productSchema.virtual('inStock').get(function() {
  if (!this.inventory.trackInventory) return true;
  return this.inventory.stock > 0;
});

// 索引
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'price.base': 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'seo.slug': 1 });

// 中间件：保存前生成slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
