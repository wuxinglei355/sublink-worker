import React from 'react';
import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

const CartPage = () => {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart,
    totalItems, 
    subtotal, 
    tax, 
    shipping, 
    total 
  } = useCartStore();
  
  const { isAuthenticated } = useAuthStore();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              购物车是空的
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              您的购物车中还没有任何商品。快去挑选一些您喜欢的产品吧！
            </p>
            <Link
              to="/products"
              className="btn btn-primary btn-lg inline-flex items-center space-x-2"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>继续购物</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                购物车
              </h1>
              <p className="text-gray-600">
                您有 {totalItems} 件商品在购物车中
              </p>
            </div>
            <Link
              to="/products"
              className="btn btn-outline inline-flex items-center space-x-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>继续购物</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 购物车商品列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-soft overflow-hidden">
              {/* 表头 */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    商品列表
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    清空购物车
                  </button>
                </div>
              </div>

              {/* 商品列表 */}
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6"
                  >
                    <div className="flex items-start space-x-4">
                      {/* 商品图片 */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.primaryImage?.url || '/images/placeholder.jpg'}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* 商品信息 */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product._id}`}
                          className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors duration-200"
                        >
                          {item.product.name}
                        </Link>
                        
                        {/* 变体信息 */}
                        {item.variants && item.variants.length > 0 && (
                          <div className="mt-1">
                            {item.variants.map((variant, index) => (
                              <span
                                key={index}
                                className="text-sm text-gray-500"
                              >
                                {variant.name}: {variant.value}
                                {index < item.variants.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 定制信息 */}
                        {item.customization && item.customization.text && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-500">
                              定制文字: {item.customization.text}
                            </p>
                          </div>
                        )}

                        {/* 价格 */}
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-lg font-medium text-gray-900">
                            {formatPrice(item.product.price.sale || item.product.price.base)}
                          </span>
                          {item.product.price.sale && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.product.price.base)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 数量控制和删除 */}
                      <div className="flex flex-col items-end space-y-4">
                        {/* 数量控制 */}
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          >
                            <FiMinus className="w-4 h-4" />
                          </button>
                          
                          <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          >
                            <FiPlus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 小计 */}
                        <div className="text-right">
                          <p className="text-lg font-medium text-gray-900">
                            {formatPrice((item.product.price.sale || item.product.price.base) * item.quantity)}
                          </p>
                        </div>

                        {/* 删除按钮 */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors duration-200"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* 订单摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                订单摘要
              </h3>

              {/* 价格明细 */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">商品小计 ({totalItems} 件)</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">税费</span>
                  <span className="text-gray-900">{formatPrice(tax)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">运费</span>
                  <span className="text-gray-900">
                    {shipping === 0 ? '免费' : formatPrice(shipping)}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-medium">
                    <span className="text-gray-900">总计</span>
                    <span className="text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* 运费提示 */}
              {shipping > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-blue-800">
                    💡 再购买 {formatPrice(50 - subtotal)} 即可享受免费配送！
                  </p>
                </div>
              )}

              {/* 结账按钮 */}
              <div className="space-y-3">
                {isAuthenticated ? (
                  <Link
                    to="/checkout"
                    className="w-full btn btn-primary btn-lg text-center"
                  >
                    立即结账
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: '/checkout' }}
                    className="w-full btn btn-primary btn-lg text-center"
                  >
                    登录后结账
                  </Link>
                )}
                
                <Link
                  to="/products"
                  className="w-full btn btn-outline text-center"
                >
                  继续购物
                </Link>
              </div>

              {/* 安全提示 */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <span>🔒</span>
                  <span>安全结账</span>
                  <span>•</span>
                  <span>SSL加密</span>
                </div>
              </div>

              {/* 支付方式 */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 mb-2">支持的支付方式</p>
                <div className="flex justify-center space-x-2">
                  <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs">💳</span>
                  </div>
                  <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs">🏦</span>
                  </div>
                  <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs">📱</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
