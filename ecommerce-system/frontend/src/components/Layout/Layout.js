import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from '../Cart/CartSidebar';
import useAuthStore from '../../store/useAuthStore';

const Layout = ({ children }) => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // 初始化认证状态
    initializeAuth();
  }, [initializeAuth]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
      
      {/* 购物车侧边栏 */}
      <CartSidebar />
    </div>
  );
};

export default Layout;
