import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// 布局组件
import AdminLayout from './components/Layout/AdminLayout';
import AuthLayout from './components/Layout/AuthLayout';

// 页面组件
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import CategoriesPage from './pages/CategoriesPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

// 受保护的路由组件
import ProtectedRoute from './components/Auth/ProtectedRoute';

// 样式
import './index.css';

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* 认证路由 */}
            <Route path="/login" element={
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            } />
            
            {/* 管理后台路由 */}
            <Route path="/*" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* 产品管理 */}
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/new" element={<ProductFormPage />} />
                    <Route path="/products/:id/edit" element={<ProductFormPage />} />
                    
                    {/* 分类管理 */}
                    <Route path="/categories" element={<CategoriesPage />} />
                    
                    {/* 订单管理 */}
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                    
                    {/* 用户管理 */}
                    <Route path="/users" element={<UsersPage />} />
                    
                    {/* 设置 */}
                    <Route path="/settings" element={<SettingsPage />} />
                    
                    {/* 404 */}
                    <Route path="*" element={
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h2>
                          <p className="text-gray-600">您访问的页面不存在</p>
                        </div>
                      </div>
                    } />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* 全局通知 */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
