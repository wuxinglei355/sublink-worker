import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiCreditCard, FiLock, FiTruck, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { ordersAPI, paymentAPI } from '../services/api';

const CheckoutPage = () => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, total, subtotal, tax, shipping, clearCart } = useCartStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      shippingAddress: {
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.email || '',
        phone: user?.profile?.phone || '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      },
      billingAddress: {
        sameAsShipping: true
      }
    }
  });

  const sameAsShipping = watch('billingAddress.sameAsShipping');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleAddressSubmit = (data) => {
    setStep(2);
  };

  const handlePaymentSubmit = async (data) => {
    setIsProcessing(true);
    
    try {
      // 创建订单
      const orderData = {
        items: items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          variants: item.variants,
          customization: item.customization
        })),
        shippingAddress: data.shippingAddress,
        billingAddress: sameAsShipping ? data.shippingAddress : data.billingAddress,
        notes: data.notes
      };

      const orderResponse = await ordersAPI.createOrder(orderData);
      
      if (orderResponse.data.order) {
        // 创建支付意图
        const paymentResponse = await paymentAPI.createPaymentIntent({
          orderId: orderResponse.data.order._id,
          paymentMethod
        });

        if (paymentResponse.data.clientSecret) {
          // 这里应该集成 Stripe 支付界面
          // 暂时模拟支付成功
          toast.success('订单创建成功！');
          clearCart();
          navigate(`/orders/${orderResponse.data.order._id}`);
        }
      }
    } catch (error) {
      console.error('结账错误:', error);
      toast.error('结账失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">购物车是空的</h2>
          <p className="text-gray-600 mb-4">请先添加商品到购物车</p>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-primary"
          >
            去购物
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">
            结账
          </h1>
          
          {/* 步骤指示器 */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">配送信息</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-300"></div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">支付信息</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-soft p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiMapPin className="w-5 h-5 mr-2" />
                  配送信息
                </h2>
                
                <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-6">
                  {/* 联系信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">名字</label>
                      <input
                        {...register('shippingAddress.firstName', {
                          required: '名字是必需的'
                        })}
                        className={`input ${errors.shippingAddress?.firstName ? 'input-error' : ''}`}
                        placeholder="名字"
                      />
                      {errors.shippingAddress?.firstName && (
                        <p className="form-error">{errors.shippingAddress.firstName.message}</p>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">姓氏</label>
                      <input
                        {...register('shippingAddress.lastName', {
                          required: '姓氏是必需的'
                        })}
                        className={`input ${errors.shippingAddress?.lastName ? 'input-error' : ''}`}
                        placeholder="姓氏"
                      />
                      {errors.shippingAddress?.lastName && (
                        <p className="form-error">{errors.shippingAddress.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">邮箱</label>
                      <input
                        {...register('shippingAddress.email', {
                          required: '邮箱是必需的',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: '请输入有效的邮箱地址'
                          }
                        })}
                        type="email"
                        className={`input ${errors.shippingAddress?.email ? 'input-error' : ''}`}
                        placeholder="邮箱地址"
                      />
                      {errors.shippingAddress?.email && (
                        <p className="form-error">{errors.shippingAddress.email.message}</p>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">电话</label>
                      <input
                        {...register('shippingAddress.phone', {
                          required: '电话是必需的'
                        })}
                        type="tel"
                        className={`input ${errors.shippingAddress?.phone ? 'input-error' : ''}`}
                        placeholder="电话号码"
                      />
                      {errors.shippingAddress?.phone && (
                        <p className="form-error">{errors.shippingAddress.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {/* 地址信息 */}
                  <div className="form-group">
                    <label className="form-label">地址</label>
                    <input
                      {...register('shippingAddress.address1', {
                        required: '地址是必需的'
                      })}
                      className={`input ${errors.shippingAddress?.address1 ? 'input-error' : ''}`}
                      placeholder="街道地址"
                    />
                    {errors.shippingAddress?.address1 && (
                      <p className="form-error">{errors.shippingAddress.address1.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">地址2（可选）</label>
                    <input
                      {...register('shippingAddress.address2')}
                      className="input"
                      placeholder="公寓、套房等"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label className="form-label">城市</label>
                      <input
                        {...register('shippingAddress.city', {
                          required: '城市是必需的'
                        })}
                        className={`input ${errors.shippingAddress?.city ? 'input-error' : ''}`}
                        placeholder="城市"
                      />
                      {errors.shippingAddress?.city && (
                        <p className="form-error">{errors.shippingAddress.city.message}</p>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">州/省</label>
                      <input
                        {...register('shippingAddress.state', {
                          required: '州/省是必需的'
                        })}
                        className={`input ${errors.shippingAddress?.state ? 'input-error' : ''}`}
                        placeholder="州/省"
                      />
                      {errors.shippingAddress?.state && (
                        <p className="form-error">{errors.shippingAddress.state.message}</p>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">邮编</label>
                      <input
                        {...register('shippingAddress.zipCode', {
                          required: '邮编是必需的'
                        })}
                        className={`input ${errors.shippingAddress?.zipCode ? 'input-error' : ''}`}
                        placeholder="邮编"
                      />
                      {errors.shippingAddress?.zipCode && (
                        <p className="form-error">{errors.shippingAddress.zipCode.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">国家</label>
                    <select
                      {...register('shippingAddress.country', {
                        required: '请选择国家'
                      })}
                      className={`input ${errors.shippingAddress?.country ? 'input-error' : ''}`}
                    >
                      <option value="US">美国</option>
                      <option value="CA">加拿大</option>
                      <option value="CN">中国</option>
                      <option value="GB">英国</option>
                    </select>
                    {errors.shippingAddress?.country && (
                      <p className="form-error">{errors.shippingAddress.country.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      继续到支付
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-soft p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiCreditCard className="w-5 h-5 mr-2" />
                  支付信息
                </h2>
                
                <form onSubmit={handleSubmit(handlePaymentSubmit)} className="space-y-6">
                  {/* 支付方式选择 */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">选择支付方式</h3>
                    
                    <div className="space-y-2">
                      <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex items-center">
                          <FiCreditCard className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="font-medium">信用卡/借记卡</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 信用卡信息 */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="form-group">
                        <label className="form-label">卡号</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label">有效期</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="MM/YY"
                            maxLength="5"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">CVV</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="123"
                            maxLength="4"
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">持卡人姓名</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="持卡人姓名"
                        />
                      </div>
                    </div>
                  )}

                  {/* 账单地址 */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">账单地址</h3>
                    
                    <label className="flex items-center">
                      <input
                        {...register('billingAddress.sameAsShipping')}
                        type="checkbox"
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        与配送地址相同
                      </span>
                    </label>
                  </div>

                  {/* 订单备注 */}
                  <div className="form-group">
                    <label className="form-label">订单备注（可选）</label>
                    <textarea
                      {...register('notes')}
                      className="input"
                      rows={3}
                      placeholder="特殊要求或备注..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn btn-outline"
                    >
                      返回配送信息
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="btn btn-primary flex items-center"
                    >
                      <FiLock className="w-4 h-4 mr-2" />
                      {isProcessing ? '处理中...' : `支付 ${formatPrice(total)}`}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* 订单摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                订单摘要
              </h3>

              {/* 商品列表 */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.product.primaryImage?.url || '/images/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        数量: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice((item.product.price.sale || item.product.price.base) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* 价格明细 */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">小计</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">运费</span>
                  <span className="text-gray-900">
                    {shipping === 0 ? '免费' : formatPrice(shipping)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">税费</span>
                  <span className="text-gray-900">{formatPrice(tax)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-medium">
                    <span className="text-gray-900">总计</span>
                    <span className="text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* 安全提示 */}
              <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                <FiLock className="w-4 h-4 mr-1" />
                <span>安全加密支付</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
