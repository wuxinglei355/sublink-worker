import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, isLoading, getCurrentUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // 如果有token但没有用户信息，尝试获取用户信息
    if (!user && !isLoading) {
      getCurrentUser();
    }
  }, [user, isLoading, getCurrentUser]);

  // 正在加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 未登录，重定向到登录页面
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // 检查角色权限
  if (requiredRole) {
    const hasRequiredRole = checkUserRole(user.role, requiredRole);
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">🚫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
            <p className="text-gray-600 mb-4">您没有权限访问此页面</p>
            <button
              onClick={() => window.history.back()}
              className="btn btn-primary"
            >
              返回上一页
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

// 检查用户角色权限
function checkUserRole(userRole, requiredRole) {
  const roleHierarchy = {
    'customer': 1,
    'admin': 2,
    'super_admin': 3
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

export default ProtectedRoute;
