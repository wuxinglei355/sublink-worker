import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiGrid, FiList, FiFilter, FiSearch, FiStar, FiHeart, FiShoppingCart } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { productsAPI, categoriesAPI } from '../services/api';
import useCartStore from '../store/useCartStore';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1
  });

  const { addItem } = useCartStore();

  // 获取产品列表
  const { data: productsData, isLoading: productsLoading } = useQuery(
    ['products', filters],
    () => productsAPI.getProducts(filters),
    {
      keepPreviousData: true
    }
  );

  // 获取分类列表
  const { data: categoriesData } = useQuery(
    'categories',
    () => categoriesAPI.getCategories()
  );

  // 更新URL参数
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // 重置页码
    }));
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const sortOptions = [
    { value: 'newest', label: '最新上架' },
    { value: 'oldest', label: '最早上架' },
    { value: 'price_low', label: '价格从低到高' },
    { value: 'price_high', label: '价格从高到低' },
    { value: 'name_asc', label: '名称 A-Z' },
    { value: 'name_desc', label: '名称 Z-A' },
    { value: 'popular', label: '最受欢迎' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                所有产品
              </h1>
              <p className="text-gray-600">
                发现我们精选的个性化定制产品
              </p>
            </div>
            
            {/* 搜索框 */}
            <div className="mt-4 md:mt-0 md:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索产品..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 侧边栏筛选 */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">筛选</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                >
                  <FiFilter className="w-5 h-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* 分类筛选 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">产品分类</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value=""
                        checked={filters.category === ''}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">全部分类</span>
                    </label>
                    {categoriesData?.categories?.map((category) => (
                      <label key={category._id} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category._id}
                          checked={filters.category === category._id}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 价格筛选 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">价格范围</h4>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="number"
                        placeholder="最低价格"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="最高价格"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 清除筛选 */}
                <button
                  onClick={() => setFilters({
                    search: '',
                    category: '',
                    minPrice: '',
                    maxPrice: '',
                    sort: 'newest',
                    page: 1
                  })}
                  className="w-full btn btn-outline btn-sm"
                >
                  清除筛选
                </button>
              </div>
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1">
            {/* 工具栏 */}
            <div className="bg-white rounded-lg shadow-soft p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* 结果统计 */}
                <div className="text-sm text-gray-600">
                  {productsData && (
                    <span>
                      显示 {productsData.products?.length || 0} 个产品，
                      共 {productsData.pagination?.totalProducts || 0} 个
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* 排序 */}
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* 视图切换 */}
                  <div className="flex border border-gray-300 rounded-md">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <FiGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <FiList className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 产品列表 */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-soft overflow-hidden animate-pulse">
                    <div className="h-64 bg-gray-200"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {productsData?.products?.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`group bg-white rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      {/* 产品图片 */}
                      <div className={`relative overflow-hidden ${
                        viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-w-4 aspect-h-3'
                      }`}>
                        <img
                          src={product.primaryImage?.url || '/images/placeholder.jpg'}
                          alt={product.name}
                          className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            viewMode === 'list' ? 'h-full' : 'h-64'
                          }`}
                        />
                        {product.discountPercentage > 0 && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                            -{product.discountPercentage}%
                          </div>
                        )}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200">
                            <FiHeart className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* 产品信息 */}
                      <div className="p-6 flex-1">
                        <div className="mb-2">
                          <span className="text-sm text-primary-600 font-medium">
                            {product.category?.name}
                          </span>
                        </div>
                        
                        <Link
                          to={`/products/${product._id}`}
                          className="block group-hover:text-primary-600 transition-colors duration-200"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        
                        {viewMode === 'list' && (
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {product.shortDescription || product.description}
                          </p>
                        )}
                        
                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.ratings?.average || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">
                            ({product.ratings?.count || 0})
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {product.price.sale ? (
                              <>
                                <span className="text-lg font-bold text-primary-600">
                                  {formatPrice(product.price.sale)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(product.price.base)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-primary-600">
                                {formatPrice(product.price.base)}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                          >
                            <FiShoppingCart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* 分页 */}
            {productsData?.pagination && productsData.pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    disabled={!productsData.pagination.hasPrevPage}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-700">
                    第 {productsData.pagination.currentPage} 页，共 {productsData.pagination.totalPages} 页
                  </span>
                  
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={!productsData.pagination.hasNextPage}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
