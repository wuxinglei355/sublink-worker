import React from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';

const CartSidebar = () => {
  const { 
    isOpen, 
    closeCart, 
    items, 
    updateQuantity, 
    removeItem, 
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={closeCart}
          />

          {/* 侧边栏 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                购物车 ({totalItems})
              </h2>
              <button
                onClick={closeCart}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* 购物车内容 */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FiShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    购物车是空的
                  </h3>
                  <p className="text-gray-500 mb-6">
                    添加一些产品开始购物吧！
                  </p>
                  <Link
                    to="/products"
                    onClick={closeCart}
                    className="btn btn-primary"
                  >
                    开始购物
                  </Link>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex space-x-4">
                      {/* 产品图片 */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.primaryImage?.url || '/images/placeholder.jpg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </div>

                      {/* 产品信息 */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        
                        {/* 变体信息 */}
                        {item.variants && item.variants.length > 0 && (
                          <div className="mt-1">
                            {item.variants.map((variant, index) => (
                              <span
                                key={index}
                                className="text-xs text-gray-500"
                              >
                                {variant.name}: {variant.value}
                                {index < item.variants.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 定制信息 */}
                        {item.customization && (
                          <div className="mt-1">
                            {item.customization.text && (
                              <p className="text-xs text-gray-500">
                                定制文字: {item.customization.text}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 价格和数量 */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatPrice(item.product.price.sale || item.product.price.base)}
                            </span>
                            {item.product.price.sale && (
                              <span className="text-xs text-gray-500 line-through">
                                {formatPrice(item.product.price.base)}
                              </span>
                            )}
                          </div>

                          {/* 数量控制 */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                              <FiMinus className="w-4 h-4" />
                            </button>
                            
                            <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                              <FiPlus className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-red-400 hover:text-red-600 transition-colors duration-200 ml-2"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部结算区域 */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-6 space-y-4">
                {/* 价格明细 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">小计</span>
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
                  
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-base font-medium">
                      <span className="text-gray-900">总计</span>
                      <span className="text-gray-900">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* 运费提示 */}
                {shipping > 0 && (
                  <div className="text-xs text-gray-500 text-center">
                    再购买 {formatPrice(50 - subtotal)} 即可享受免费配送
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="space-y-3">
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="w-full btn btn-outline text-center"
                  >
                    查看购物车
                  </Link>
                  
                  {isAuthenticated ? (
                    <Link
                      to="/checkout"
                      onClick={closeCart}
                      className="w-full btn btn-primary text-center"
                    >
                      立即结账
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={closeCart}
                      className="w-full btn btn-primary text-center"
                    >
                      登录后结账
                    </Link>
                  )}
                </div>

                {/* 安全提示 */}
                <div className="text-xs text-gray-500 text-center">
                  🔒 安全结账 · 支持多种支付方式
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
