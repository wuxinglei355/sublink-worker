import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  
  const { register: registerUser, isLoading, isAuthenticated, error, clearError } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setFocus
  } = useForm();

  const password = watch('password');

  // 如果已登录，重定向
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 清除错误信息
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // 自动聚焦到邮箱输入框
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data;
    
    const result = await registerUser(userData);
    
    if (result.success) {
      toast.success('注册成功！欢迎加入 WayRumble！');
      navigate('/', { replace: true });
    } else {
      toast.error(result.error || '注册失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <Link to="/" className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="text-2xl font-serif font-bold text-gray-900">
              WayRumble
            </span>
          </div>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          <h2 className="text-center text-3xl font-bold text-gray-900">
            创建您的账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账户？{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              立即登录
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-soft sm:rounded-lg sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* 邮箱输入 */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: '邮箱地址是必需的',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: '请输入有效的邮箱地址'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="输入您的邮箱地址"
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* 姓名输入 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  名字
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('profile.firstName', {
                      required: '名字是必需的',
                      minLength: {
                        value: 2,
                        message: '名字至少需要2个字符'
                      }
                    })}
                    type="text"
                    autoComplete="given-name"
                    className={`input pl-10 ${errors.profile?.firstName ? 'input-error' : ''}`}
                    placeholder="名字"
                  />
                </div>
                {errors.profile?.firstName && (
                  <p className="form-error">{errors.profile.firstName.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  姓氏
                </label>
                <input
                  {...register('profile.lastName', {
                    required: '姓氏是必需的',
                    minLength: {
                      value: 2,
                      message: '姓氏至少需要2个字符'
                    }
                  })}
                  type="text"
                  autoComplete="family-name"
                  className={`input ${errors.profile?.lastName ? 'input-error' : ''}`}
                  placeholder="姓氏"
                />
                {errors.profile?.lastName && (
                  <p className="form-error">{errors.profile.lastName.message}</p>
                )}
              </div>
            </div>

            {/* 密码输入 */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: '密码是必需的',
                    minLength: {
                      value: 6,
                      message: '密码至少需要6个字符'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: '密码必须包含大小写字母和数字'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="输入您的密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
              <div className="mt-1 text-xs text-gray-500">
                密码必须包含大小写字母和数字，至少6个字符
              </div>
            </div>

            {/* 确认密码输入 */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                确认密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: '请确认您的密码',
                    validate: value => value === password || '两次输入的密码不一致'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="再次输入密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* 服务条款 */}
            <div className="flex items-center">
              <input
                {...register('agreeToTerms', {
                  required: '请同意服务条款和隐私政策'
                })}
                id="agree-terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                我同意{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  服务条款
                </Link>
                {' '}和{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  隐私政策
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="form-error">{errors.agreeToTerms.message}</p>
            )}

            {/* 错误信息 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-md p-3"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* 注册按钮 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary btn-lg relative"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    注册中...
                  </>
                ) : (
                  '创建账户'
                )}
              </button>
            </div>
          </form>

          {/* 分割线 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者</span>
              </div>
            </div>
          </div>

          {/* 社交注册 */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="sr-only">使用Google注册</span>
              <span className="text-lg">🔍</span>
              <span className="ml-2">Google</span>
            </button>

            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="sr-only">使用Facebook注册</span>
              <span className="text-lg">📘</span>
              <span className="ml-2">Facebook</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
