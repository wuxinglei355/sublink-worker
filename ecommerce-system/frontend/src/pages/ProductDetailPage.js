import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiHeart, FiShare2, FiMinus, FiPlus, FiShoppingCart, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { productsAPI } from '../services/api';
import useCartStore from '../store/useCartStore';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [customization, setCustomization] = useState({
    text: '',
    image: null
  });

  const { addItem } = useCartStore();

  // 获取产品详情
  const { data, isLoading, error } = useQuery(
    ['product', id],
    () => productsAPI.getProduct(id)
  );

  const product = data?.product;
  const relatedProducts = data?.relatedProducts || [];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const calculatePrice = () => {
    if (!product) return 0;
    
    let basePrice = product.price.sale || product.price.base;
    
    // 添加变体价格调整
    Object.entries(selectedVariants).forEach(([variantName, selectedValue]) => {
      const variant = product.variants?.find(v => v.name === variantName);
      const option = variant?.options?.find(o => o.value === selectedValue);
      if (option?.priceModifier) {
        basePrice += option.priceModifier;
      }
    });
    
    return basePrice * quantity;
  };

  const handleVariantChange = (variantName, value) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: value
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;

    // 检查必需的变体是否已选择
    const requiredVariants = product.variants?.filter(v => v.options?.length > 0) || [];
    const missingVariants = requiredVariants.filter(v => !selectedVariants[v.name]);
    
    if (missingVariants.length > 0) {
      toast.error(`请选择 ${missingVariants.map(v => v.name).join(', ')}`);
      return;
    }

    // 转换变体格式
    const variants = Object.entries(selectedVariants).map(([name, value]) => ({
      name,
      value
    }));

    // 添加到购物车
    addItem(product, quantity, variants, customization.text ? { text: customization.text } : null);
    toast.success('已添加到购物车！');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">加载产品信息中...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">产品未找到</h2>
          <p className="text-gray-600 mb-4">抱歉，您访问的产品不存在或已下架</p>
          <Link to="/products" className="btn btn-primary">
            返回产品列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 面包屑导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">首页</Link>
            <span className="text-gray-400">/</span>
            <Link to="/products" className="text-gray-500 hover:text-gray-700">产品</Link>
            <span className="text-gray-400">/</span>
            <Link to={`/category/${product.category.slug}`} className="text-gray-500 hover:text-gray-700">
              {product.category.name}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 产品图片 */}
          <div className="space-y-4">
            {/* 主图 */}
            <div className="aspect-w-4 aspect-h-3 bg-white rounded-lg overflow-hidden shadow-soft">
              <img
                src={product.images[selectedImage]?.url || '/images/placeholder.jpg'}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </div>
            
            {/* 缩略图 */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors duration-200 ${
                      selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 产品信息 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <div>
              <div className="mb-2">
                <span className="text-sm text-primary-600 font-medium">
                  {product.category.name}
                </span>
              </div>
              
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.ratings?.average || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  {product.ratings?.average?.toFixed(1)} ({product.ratings?.count || 0} 评价)
                </span>
              </div>

              {/* 价格 */}
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  {formatPrice(calculatePrice())}
                </span>
                {product.price.sale && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.price.base * quantity)}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm font-medium">
                      省 {formatPrice((product.price.base - product.price.sale) * quantity)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 产品描述 */}
            <div>
              <p className="text-gray-700 leading-relaxed">
                {product.shortDescription || product.description}
              </p>
            </div>

            {/* 变体选择 */}
            {product.variants?.map((variant) => (
              <div key={variant.name}>
                <h4 className="font-medium text-gray-900 mb-3">{variant.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {variant.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleVariantChange(variant.name, option.value)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors duration-200 ${
                        selectedVariants[variant.name] === option.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {option.value}
                      {option.priceModifier > 0 && (
                        <span className="ml-1 text-xs">
                          (+{formatPrice(option.priceModifier)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* 定制选项 */}
            {product.customization?.allowText && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">个性化文字</h4>
                <textarea
                  value={customization.text}
                  onChange={(e) => setCustomization(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="输入您想要的文字内容..."
                  maxLength={product.customization.textOptions?.maxLength || 100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customization.text.length}/{product.customization.textOptions?.maxLength || 100} 字符
                </p>
              </div>
            )}

            {/* 数量选择 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">数量</h4>
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
                
                {product.inventory?.trackInventory && (
                  <span className="text-sm text-gray-600">
                    库存: {product.inventory.stock} 件
                  </span>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="w-full btn btn-primary btn-lg flex items-center justify-center space-x-2"
              >
                <FiShoppingCart className="w-5 h-5" />
                <span>{product.inStock ? '加入购物车' : '暂时缺货'}</span>
              </button>
              
              <div className="flex space-x-3">
                <button className="flex-1 btn btn-outline flex items-center justify-center space-x-2">
                  <FiHeart className="w-5 h-5" />
                  <span>收藏</span>
                </button>
                <button className="flex-1 btn btn-outline flex items-center justify-center space-x-2">
                  <FiShare2 className="w-5 h-5" />
                  <span>分享</span>
                </button>
              </div>
            </div>

            {/* 服务保障 */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <FiTruck className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">免费配送</p>
                    <p className="text-xs text-gray-500">满$50免运费</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FiShield className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">品质保证</p>
                    <p className="text-xs text-gray-500">100%满意保证</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FiRefreshCw className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">退换服务</p>
                    <p className="text-xs text-gray-500">30天无理由退换</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 产品详细描述 */}
        <div className="mt-16 bg-white rounded-lg shadow-soft p-8">
          <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">产品详情</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>

        {/* 相关产品 */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-8">相关产品</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct._id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
                >
                  <Link to={`/products/${relatedProduct._id}`}>
                    <img
                      src={relatedProduct.primaryImage?.url || '/images/placeholder.jpg'}
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {relatedProduct.price.sale ? (
                          <>
                            <span className="font-bold text-primary-600">
                              {formatPrice(relatedProduct.price.sale)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(relatedProduct.price.base)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-primary-600">
                            {formatPrice(relatedProduct.price.base)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
