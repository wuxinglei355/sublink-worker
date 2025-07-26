import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus
  } = useForm();

  // 如果已登录，重定向
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // 清除错误信息
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // 自动聚焦到邮箱输入框
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data) => {
    const result = await login(data);
    
    if (result.success) {
      toast.success('登录成功！');
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } else {
      toast.error(result.error || '登录失败');
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
            欢迎回来
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            还没有账户？{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              立即注册
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
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
                >
                  忘记密码？
                </Link>
              </div>
            </div>

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

            {/* 登录按钮 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary btn-lg relative"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    登录中...
                  </>
                ) : (
                  '登录'
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

          {/* 社交登录 */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="sr-only">使用Google登录</span>
              <span className="text-lg">🔍</span>
              <span className="ml-2">Google</span>
            </button>

            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="sr-only">使用Facebook登录</span>
              <span className="text-lg">📘</span>
              <span className="ml-2">Facebook</span>
            </button>
          </div>

          {/* 演示账户 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">演示账户</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>普通用户:</strong> user@wayrumble.com / 123456</p>
              <p><strong>管理员:</strong> admin@wayrumble.com / admin123456</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
