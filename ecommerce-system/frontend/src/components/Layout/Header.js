import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiShoppingCart, 
  FiUser, 
  FiMenu, 
  FiX,
  FiHeart,
  FiLogOut
} from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalItems, openCart } = useCartStore();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const navigationLinks = [
    { name: '首页', href: '/' },
    { name: '所有产品', href: '/products' },
    { name: '画布', href: '/category/canvas' },
    { name: '马克杯', href: '/category/mug' },
    { name: '装饰品', href: '/category/ornament' },
    { name: '服装', href: '/category/apparel' },
    { name: '关于我们', href: '/about' },
    { name: '联系我们', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* 顶部公告栏 */}
      <div className="bg-primary-600 text-white text-center py-2 text-sm">
        <p>🎉 新用户注册享受首单8折优惠！免费送货满$50+ 🚚</p>
      </div>

      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-2xl font-serif font-bold text-gray-900">
                WayRumble
              </span>
            </Link>
          </div>

          {/* 桌面端导航 */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationLinks.slice(0, 6).map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* 搜索框 */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="搜索产品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </form>
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center space-x-4">
            {/* 移动端搜索按钮 */}
            <button className="md:hidden p-2 text-gray-700 hover:text-primary-600">
              <FiSearch className="w-6 h-6" />
            </button>

            {/* 收藏夹 */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
              >
                <FiHeart className="w-6 h-6" />
              </Link>
            )}

            {/* 购物车 */}
            <button
              onClick={openCart}
              className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              <FiShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* 用户菜单 */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {user?.profile?.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </button>

                  {/* 用户下拉菜单 */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.profile?.fullName}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        个人资料
                      </Link>
                      
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        我的订单
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                  >
                    登录
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    to="/register"
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-primary-600"
            >
              {isMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            
            {/* 移动端搜索框 */}
            <div className="mt-4 px-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="搜索产品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 点击外部关闭用户菜单 */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
