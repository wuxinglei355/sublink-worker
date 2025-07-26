import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  FiUsers, 
  FiPackage, 
  FiShoppingBag, 
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiEye,
  FiEdit,
  FiAlertTriangle
} from 'react-icons/fi';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { adminAPI } from '../services/api';

const DashboardPage = () => {
  const [period, setPeriod] = useState('30d');

  // 获取仪表板数据
  const { data: dashboardData, isLoading } = useQuery(
    ['dashboard', period],
    () => adminAPI.getDashboardStats({ period }),
    {
      refetchInterval: 30000 // 30秒刷新一次
    }
  );

  // 获取库存警报
  const { data: inventoryAlerts } = useQuery(
    'inventory-alerts',
    () => adminAPI.getInventoryAlerts()
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const periodOptions = [
    { value: '7d', label: '最近7天' },
    { value: '30d', label: '最近30天' },
    { value: '90d', label: '最近90天' },
    { value: '1y', label: '最近1年' }
  ];

  const orderStatusColors = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#8b5cf6',
    shipped: '#10b981',
    delivered: '#059669',
    cancelled: '#ef4444',
    refunded: '#6b7280'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">加载仪表板数据中...</p>
        </div>
      </div>
    );
  }

  const overview = dashboardData?.overview || {};
  const orderStats = dashboardData?.orderStats || {};
  const recentOrders = dashboardData?.recentOrders || [];
  const topProducts = dashboardData?.topProducts || [];
  const revenueChart = dashboardData?.revenueChart || [];

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-600">欢迎回到管理后台</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 库存警报 */}
      {inventoryAlerts && (inventoryAlerts.alerts.lowStock > 0 || inventoryAlerts.alerts.outOfStock > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiAlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">库存警报</h3>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            {inventoryAlerts.alerts.outOfStock > 0 && (
              <span className="mr-4">
                {inventoryAlerts.alerts.outOfStock} 个产品缺货
              </span>
            )}
            {inventoryAlerts.alerts.lowStock > 0 && (
              <span>
                {inventoryAlerts.alerts.lowStock} 个产品库存不足
              </span>
            )}
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总收入</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(overview.totalRevenue || 0)}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                期间收入: {formatCurrency(overview.periodRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总订单</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(overview.totalOrders || 0)}
              </p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                新订单: {formatNumber(overview.newOrders || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总用户</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(overview.totalUsers || 0)}
              </p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                新用户: {formatNumber(overview.newUsers || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总产品</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(overview.totalProducts || 0)}
              </p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <FiPackage className="w-4 h-4 mr-1" />
                平均订单: {formatCurrency(overview.averageOrderValue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiPackage className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 收入趋势图 */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">收入趋势</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), '收入']}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 订单状态分布 */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">订单状态分布</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(orderStats).map(([status, count]) => ({
                    name: status,
                    value: count,
                    color: orderStatusColors[status]
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {Object.entries(orderStats).map(([status], index) => (
                    <Cell key={index} fill={orderStatusColors[status]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 最近订单和热销产品 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近订单 */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">最近订单</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              查看全部
            </button>
          </div>
          
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="ml-4 flex space-x-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <FiEdit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 热销产品 */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">热销产品</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              查看全部
            </button>
          </div>
          
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {index + 1}
                  </span>
                </div>
                <img
                  src={product.image?.url || '/images/placeholder.jpg'}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    销量: {product.salesCount}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
