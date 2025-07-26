import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiStar, FiHeart, FiShoppingCart } from 'react-icons/fi';
import { motion } from 'framer-motion';

const HomePage = () => {
  // 模拟数据 - 实际项目中应该从API获取
  const featuredProducts = [
    {
      id: 1,
      name: '耶稣风景画布印刷',
      price: { base: 49.99, sale: 39.99 },
      image: '/images/products/jesus-canvas-1.jpg',
      rating: 4.8,
      reviews: 124,
      category: '宗教系列'
    },
    {
      id: 2,
      name: '家庭定制马克杯',
      price: { base: 19.99 },
      image: '/images/products/family-mug-1.jpg',
      rating: 4.9,
      reviews: 89,
      category: '家庭系列'
    },
    {
      id: 3,
      name: '宠物纪念装饰品',
      price: { base: 29.99, sale: 24.99 },
      image: '/images/products/pet-ornament-1.jpg',
      rating: 4.7,
      reviews: 156,
      category: '宠物系列'
    },
    {
      id: 4,
      name: '情侣定制项链',
      price: { base: 39.99 },
      image: '/images/products/couple-necklace-1.jpg',
      rating: 4.8,
      reviews: 203,
      category: '情侣系列'
    },
  ];

  const categories = [
    {
      name: '画布印刷',
      slug: 'canvas',
      image: '/images/categories/canvas.jpg',
      description: '高品质画布印刷，让您的回忆永恒'
    },
    {
      name: '马克杯',
      slug: 'mug',
      image: '/images/categories/mug.jpg',
      description: '个性化马克杯，每一口都是温暖'
    },
    {
      name: '装饰品',
      slug: 'ornament',
      image: '/images/categories/ornament.jpg',
      description: '精美装饰品，装点您的美好生活'
    },
    {
      name: '服装',
      slug: 'apparel',
      image: '/images/categories/apparel.jpg',
      description: '定制服装，展现独特个性'
    },
  ];

  const testimonials = [
    {
      name: '张女士',
      location: '北京',
      content: '收到的画布质量超出预期，颜色鲜艳，做工精细。客服态度也很好，会继续支持！',
      rating: 5,
      product: '家庭照片画布'
    },
    {
      name: '李先生',
      location: '上海',
      content: '给女朋友定制的项链她非常喜欢，包装也很精美。发货速度很快，推荐！',
      rating: 5,
      product: '情侣定制项链'
    },
    {
      name: '王女士',
      location: '广州',
      content: '马克杯的印刷效果很好，图案清晰，颜色不褪色。价格也很实惠。',
      rating: 4,
      product: '个性化马克杯'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* 英雄区域 */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container-custom py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl lg:text-6xl font-serif font-bold mb-6 leading-tight">
                定制您的
                <span className="block text-yellow-300">专属礼品</span>
              </h1>
              <p className="text-xl mb-8 text-gray-100 leading-relaxed">
                高品质个性化定制服务，让每一份礼物都承载着您的心意和故事。
                从画布印刷到马克杯，从装饰品到服装，我们为您打造独一无二的专属礼品。
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/products"
                  className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 inline-flex items-center justify-center"
                >
                  开始购物
                  <FiArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/about"
                  className="btn btn-lg border-white text-white hover:bg-white hover:text-primary-600 inline-flex items-center justify-center"
                >
                  了解更多
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <img
                  src="/images/hero-products.jpg"
                  alt="精美定制产品展示"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full bg-yellow-300 rounded-lg opacity-20"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 产品分类 */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
              热门分类
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              探索我们的产品分类，找到最适合您的定制礼品
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/category/${category.slug}`}
                  className="group block bg-white rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-w-4 aspect-h-3 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                      {category.name}
                    </h3>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 特色产品 */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
              热销产品
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              精选最受欢迎的定制产品，品质保证，客户好评如潮
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.price.sale && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                      特价
                    </div>
                  )}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200">
                      <FiHeart className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-2">
                    <span className="text-sm text-primary-600 font-medium">
                      {product.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      ({product.reviews})
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {product.price.sale ? (
                        <>
                          <span className="text-lg font-bold text-primary-600">
                            ${product.price.sale}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ${product.price.base}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary-600">
                          ${product.price.base}
                        </span>
                      )}
                    </div>
                    
                    <button className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200">
                      <FiShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="btn btn-primary btn-lg inline-flex items-center"
            >
              查看所有产品
              <FiArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 客户评价 */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
              客户评价
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              听听我们客户的真实反馈，他们的满意是我们前进的动力
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-6"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-primary-600 font-medium">
                        {testimonial.product}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-6">
              准备开始您的定制之旅？
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-100">
              立即浏览我们的产品，或联系我们的专业团队，
              让我们帮您打造独一无二的专属礼品。
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/products"
                className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 inline-flex items-center justify-center"
              >
                立即购物
                <FiShoppingCart className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/contact"
                className="btn btn-lg border-white text-white hover:bg-white hover:text-primary-600 inline-flex items-center justify-center"
              >
                联系我们
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
