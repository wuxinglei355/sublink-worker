import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // 状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 登录
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post('/auth/login', credentials);
          const { token, user } = response.data;
          
          // 设置认证头
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || '登录失败';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // 注册
      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post('/auth/register', userData);
          const { token, user } = response.data;
          
          // 设置认证头
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || '注册失败';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // 登出
      logout: () => {
        // 清除认证头
        delete api.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      // 获取当前用户信息
      getCurrentUser: async () => {
        const { token } = get();
        
        if (!token) {
          return { success: false, error: '未登录' };
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.get('/auth/me');
          const { user } = response.data;
          
          set({
            user,
            isLoading: false,
            error: null
          });
          
          return { success: true, data: user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || '获取用户信息失败';
          
          // 如果token无效，清除认证状态
          if (error.response?.status === 401) {
            get().logout();
          }
          
          set({
            isLoading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // 更新用户资料
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.put('/auth/profile', profileData);
          const { user } = response.data;
          
          set({
            user,
            isLoading: false,
            error: null
          });
          
          return { success: true, data: user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || '更新资料失败';
          set({
            isLoading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // 修改密码
      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.put('/auth/password', passwordData);
          
          set({
            isLoading: false,
            error: null
          });
          
          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || '修改密码失败';
          set({
            isLoading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 初始化认证状态
      initializeAuth: () => {
        const { token } = get();
        
        if (token) {
          // 设置认证头
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // 验证token有效性
          get().getCurrentUser();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
