import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`;
        }
      } catch (error) {
        console.error('解析token失败:', error);
      }
    }
    
    // 添加请求时间戳
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 计算请求耗时
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`API请求: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权，清除本地存储的认证信息
          localStorage.removeItem('auth-storage');
          
          // 如果不是登录页面，重定向到登录页面
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // 权限不足
          console.error('权限不足:', data.message);
          break;
          
        case 404:
          // 资源未找到
          console.error('资源未找到:', data.message);
          break;
          
        case 422:
          // 验证错误
          console.error('验证错误:', data.errors || data.message);
          break;
          
        case 429:
          // 请求过于频繁
          console.error('请求过于频繁，请稍后再试');
          break;
          
        case 500:
          // 服务器错误
          console.error('服务器内部错误');
          break;
          
        default:
          console.error('请求失败:', data.message || '未知错误');
      }
    } else if (error.request) {
      // 网络错误
      console.error('网络错误，请检查网络连接');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API方法封装
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/password', passwordData),
};

export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const categoriesAPI = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const ordersAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
};

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
  uploadMultipleImages: (files, folder = 'general') => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('folder', folder);
    
    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const paymentAPI = {
  createPaymentIntent: (orderData) => api.post('/payment/create-intent', orderData),
  confirmPayment: (paymentIntentId) => api.post('/payment/confirm', { paymentIntentId }),
  getPaymentMethods: () => api.get('/payment/methods'),
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),
  getOrderStats: (params) => api.get('/admin/orders/stats', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status`, { status }),
};

export default api;
