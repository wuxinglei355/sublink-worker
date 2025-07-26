import axios from 'axios';
import toast from 'react-hot-toast';

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || error.message || '请求失败';
    console.error('API Error:', message);
    
    return Promise.reject(error);
  }
);

// 认证 API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// 产品管理 API
export const productsAPI = {
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateProductStatus: (id, status) => api.put(`/products/${id}/status`, { status }),
  bulkUpdateProducts: (productIds, updates) => 
    api.put('/products/bulk', { productIds, updates }),
  getProductStats: () => api.get('/products/stats'),
};

// 分类管理 API
export const categoriesAPI = {
  getCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  updateCategoryStatus: (id, status) => api.put(`/categories/${id}/status`, { status }),
};

// 订单管理 API
export const ordersAPI = {
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status, note) => 
    api.put(`/orders/${id}/status`, { status, note }),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  getOrderStats: (params = {}) => api.get('/orders/stats', { params }),
  exportOrders: (params = {}) => api.get('/orders/export', { params }),
};

// 用户管理 API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUserStatus: (id, status, reason) => 
    api.put(`/users/${id}/status`, { status, reason }),
  updateUserRole: (id, role) => 
    api.put(`/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: (params = {}) => api.get('/users/stats/overview', { params }),
};

// 文件上传 API
export const uploadAPI = {
  uploadImage: (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadImages: (files, folder = 'general') => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    formData.append('folder', folder);
    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteImage: (publicId) => 
    api.delete(`/upload/image/${encodeURIComponent(publicId)}`),
  getImageInfo: (publicId) => 
    api.get(`/upload/image/${encodeURIComponent(publicId)}`),
  getFolderImages: (folderName, params = {}) => 
    api.get(`/upload/folder/${folderName}`, { params }),
  transformImage: (publicId, transformations) => 
    api.post('/upload/transform', { publicId, transformations }),
};

// 支付管理 API
export const paymentAPI = {
  getPaymentMethods: () => api.get('/payment/methods'),
  refund: (orderId, amount, reason) => 
    api.post('/payment/refund', { orderId, amount, reason }),
  getPaymentStats: (params = {}) => api.get('/payment/stats', { params }),
};

// 管理员仪表板 API
export const adminAPI = {
  getDashboardStats: (params = {}) => api.get('/admin/dashboard', { params }),
  getSalesStats: (params = {}) => api.get('/admin/sales/stats', { params }),
  getInventoryAlerts: () => api.get('/admin/inventory/alerts'),
  getActivityLog: (params = {}) => api.get('/admin/activity', { params }),
};

// 设置 API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
  getSystemInfo: () => api.get('/settings/system'),
  clearCache: () => api.post('/settings/clear-cache'),
  backupDatabase: () => api.post('/settings/backup'),
  getBackups: () => api.get('/settings/backups'),
  restoreBackup: (backupId) => api.post(`/settings/restore/${backupId}`),
};

// 通用错误处理函数
export const handleApiError = (error, defaultMessage = '操作失败') => {
  const message = error.response?.data?.message || error.message || defaultMessage;
  toast.error(message);
  return { success: false, error: message };
};

// 通用成功处理函数
export const handleApiSuccess = (response, successMessage) => {
  if (successMessage) {
    toast.success(successMessage);
  }
  return { success: true, data: response.data };
};

// 导出默认实例
export default api;
