// MongoDB 数据库初始化脚本
// 使用方法: node init-db.js

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// 导入模型
const User = require('./backend/models/User');
const Category = require('./backend/models/Category');
const Product = require('./backend/models/Product');

async function initDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wayrumble_ecommerce');
    console.log('✅ 数据库连接成功');

    // 创建默认分类
    console.log('📂 创建产品分类...');
    const categories = [
      {
        name: '画布印刷',
        slug: 'canvas',
        description: '高品质画布印刷产品，让您的回忆永恒',
        image: {
          url: '/images/categories/canvas.jpg',
          alt: '画布印刷'
        },
        seo: {
          metaTitle: '画布印刷 - 高品质定制画布',
          metaDescription: '专业画布印刷服务，高品质材料，精美工艺',
          keywords: ['画布印刷', '定制画布', '照片画布', '艺术画布']
        }
      },
      {
        name: '马克杯',
        slug: 'mug',
        description: '个性化马克杯定制，每一口都是温暖',
        image: {
          url: '/images/categories/mug.jpg',
          alt: '马克杯'
        },
        seo: {
          metaTitle: '定制马克杯 - 个性化杯子定制',
          metaDescription: '个性化马克杯定制，高品质陶瓷，安全环保',
          keywords: ['定制马克杯', '个性化杯子', '照片马克杯', '礼品杯子']
        }
      },
      {
        name: '装饰品',
        slug: 'ornament',
        description: '精美装饰品系列，装点您的美好生活',
        image: {
          url: '/images/categories/ornament.jpg',
          alt: '装饰品'
        },
        seo: {
          metaTitle: '定制装饰品 - 个性化家居装饰',
          metaDescription: '精美装饰品定制，独特设计，品质保证',
          keywords: ['定制装饰品', '家居装饰', '个性化装饰', '纪念品']
        }
      },
      {
        name: '项链',
        slug: 'necklace',
        description: '定制项链首饰，展现独特魅力',
        image: {
          url: '/images/categories/necklace.jpg',
          alt: '项链'
        },
        seo: {
          metaTitle: '定制项链 - 个性化首饰定制',
          metaDescription: '个性化项链定制，精美工艺，独特设计',
          keywords: ['定制项链', '个性化首饰', '纪念项链', '礼品首饰']
        }
      },
      {
        name: '服装',
        slug: 'apparel',
        description: '个性化服装定制，展现独特个性',
        image: {
          url: '/images/categories/apparel.jpg',
          alt: '服装'
        },
        seo: {
          metaTitle: '定制服装 - 个性化服装定制',
          metaDescription: '个性化服装定制，高品质面料，独特设计',
          keywords: ['定制服装', '个性化T恤', '定制卫衣', '印花服装']
        }
      },
      {
        name: '毯子',
        slug: 'blanket',
        description: '温暖舒适的定制毯子，传递温暖与爱',
        image: {
          url: '/images/categories/blanket.jpg',
          alt: '毯子'
        },
        seo: {
          metaTitle: '定制毯子 - 个性化毯子定制',
          metaDescription: '个性化毯子定制，柔软舒适，温暖贴心',
          keywords: ['定制毯子', '个性化毯子', '照片毯子', '纪念毯子']
        }
      }
    ];

    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      if (!existingCategory) {
        await Category.create(categoryData);
        console.log(`✅ 创建分类: ${categoryData.name}`);
      } else {
        console.log(`⚠️  分类已存在: ${categoryData.name}`);
      }
    }

    // 创建示例产品
    console.log('📦 创建示例产品...');
    const canvasCategory = await Category.findOne({ slug: 'canvas' });
    const mugCategory = await Category.findOne({ slug: 'mug' });

    const products = [
      {
        name: '耶稣风景画布印刷 - I Still Believe in Amazing Grace',
        description: '精美的耶稣风景画布印刷，展现信仰的力量与美好。高品质画布材料，色彩鲜艳持久，适合家居装饰或作为礼品赠送。',
        shortDescription: '精美耶稣风景画布，展现信仰力量',
        category: canvasCategory._id,
        subcategory: '宗教系列',
        images: [
          {
            url: '/images/products/jesus-canvas-1.jpg',
            alt: '耶稣风景画布印刷',
            isPrimary: true
          }
        ],
        price: {
          base: 49.99,
          sale: 39.99,
          currency: 'USD'
        },
        variants: [
          {
            name: '尺寸',
            options: [
              { value: '12x16', priceModifier: 0, stock: 50 },
              { value: '16x20', priceModifier: 10, stock: 30 },
              { value: '20x24', priceModifier: 20, stock: 20 },
              { value: '24x36', priceModifier: 35, stock: 15 }
            ]
          }
        ],
        customization: {
          allowText: true,
          allowImage: false,
          textOptions: {
            maxLength: 100,
            fonts: ['Arial', 'Times New Roman', 'Georgia'],
            colors: ['#000000', '#FFFFFF', '#8B4513']
          }
        },
        inventory: {
          stock: 100,
          lowStockThreshold: 10,
          trackInventory: true
        },
        shipping: {
          weight: 500,
          dimensions: { length: 30, width: 25, height: 2 },
          shippingClass: 'standard'
        },
        seo: {
          metaTitle: '耶稣风景画布印刷 - 信仰艺术装饰',
          metaDescription: '精美耶稣风景画布印刷，高品质材料，展现信仰力量',
          keywords: ['耶稣画布', '宗教艺术', '信仰装饰', '画布印刷']
        },
        status: 'active',
        featured: true,
        tags: ['宗教', '耶稣', '风景', '信仰', '画布'],
        ratings: {
          average: 4.8,
          count: 124
        },
        salesCount: 89
      },
      {
        name: '家庭定制马克杯 - 温馨时光',
        description: '个性化家庭照片马克杯，记录美好时光。高品质陶瓷材料，安全环保，可微波炉和洗碗机使用。完美的家庭礼品选择。',
        shortDescription: '个性化家庭照片马克杯，记录美好时光',
        category: mugCategory._id,
        subcategory: '家庭系列',
        images: [
          {
            url: '/images/products/family-mug-1.jpg',
            alt: '家庭定制马克杯',
            isPrimary: true
          }
        ],
        price: {
          base: 19.99,
          currency: 'USD'
        },
        variants: [
          {
            name: '容量',
            options: [
              { value: '11oz', priceModifier: 0, stock: 100 },
              { value: '15oz', priceModifier: 3, stock: 80 }
            ]
          },
          {
            name: '颜色',
            options: [
              { value: '白色', priceModifier: 0, stock: 150 },
              { value: '黑色', priceModifier: 2, stock: 100 },
              { value: '蓝色', priceModifier: 2, stock: 80 }
            ]
          }
        ],
        customization: {
          allowText: true,
          allowImage: true,
          textOptions: {
            maxLength: 50,
            fonts: ['Arial', 'Comic Sans MS', 'Times New Roman'],
            colors: ['#000000', '#FFFFFF', '#FF0000', '#0000FF']
          },
          imageOptions: {
            maxSize: 5242880,
            allowedFormats: ['jpg', 'jpeg', 'png']
          }
        },
        inventory: {
          stock: 200,
          lowStockThreshold: 20,
          trackInventory: true
        },
        shipping: {
          weight: 350,
          dimensions: { length: 12, width: 10, height: 10 },
          shippingClass: 'standard'
        },
        seo: {
          metaTitle: '家庭定制马克杯 - 个性化照片杯子',
          metaDescription: '个性化家庭照片马克杯，高品质陶瓷，记录美好时光',
          keywords: ['定制马克杯', '家庭照片杯', '个性化杯子', '礼品杯']
        },
        status: 'active',
        featured: true,
        tags: ['家庭', '马克杯', '定制', '照片', '礼品'],
        ratings: {
          average: 4.9,
          count: 89
        },
        salesCount: 156
      }
    ];

    for (const productData of products) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (!existingProduct) {
        await Product.create(productData);
        console.log(`✅ 创建产品: ${productData.name}`);
      } else {
        console.log(`⚠️  产品已存在: ${productData.name}`);
      }
    }

    // 更新分类产品数量
    await updateCategoryProductCounts();

    // 创建管理员账户
    console.log('👤 创建管理员账户...');
    const adminEmail = 'admin@wayrumble.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: 'admin123456',
        profile: {
          firstName: '管理员',
          lastName: '账户'
        },
        role: 'admin',
        status: 'active',
        emailVerified: true
      });
      console.log('✅ 创建管理员账户');
      console.log('📧 邮箱: admin@wayrumble.com');
      console.log('🔑 密码: admin123456');
    } else {
      console.log('⚠️  管理员账户已存在');
    }

    // 创建测试用户账户
    console.log('👤 创建测试用户账户...');
    const userEmail = 'user@wayrumble.com';
    const existingUser = await User.findOne({ email: userEmail });
    
    if (!existingUser) {
      await User.create({
        email: userEmail,
        password: '123456',
        profile: {
          firstName: '测试',
          lastName: '用户'
        },
        role: 'customer',
        status: 'active',
        emailVerified: true
      });
      console.log('✅ 创建测试用户账户');
      console.log('📧 邮箱: user@wayrumble.com');
      console.log('🔑 密码: 123456');
    } else {
      console.log('⚠️  测试用户账户已存在');
    }

    console.log('');
    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📋 账户信息:');
    console.log('管理员账户: admin@wayrumble.com / admin123456');
    console.log('测试用户: user@wayrumble.com / 123456');
    console.log('');
    console.log('🌐 访问地址:');
    console.log('前端: http://localhost:3000');
    console.log('管理后台: http://localhost:3001');
    console.log('后端API: http://localhost:5000');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 更新分类产品数量
async function updateCategoryProductCounts() {
  const categories = await Category.find();
  
  for (const category of categories) {
    const productCount = await Product.countDocuments({ 
      category: category._id, 
      status: 'active' 
    });
    
    await Category.findByIdAndUpdate(category._id, { 
      productCount 
    });
  }
  
  console.log('✅ 更新分类产品数量');
}

// 运行初始化
initDatabase();
