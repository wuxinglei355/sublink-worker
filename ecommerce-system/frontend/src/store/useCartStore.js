import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      // 状态
      items: [],
      isOpen: false,

      // 计算属性
      get totalItems() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get totalPrice() {
        return get().items.reduce((total, item) => {
          const price = item.product.price.sale || item.product.price.base;
          return total + (price * item.quantity);
        }, 0);
      },

      get subtotal() {
        return get().totalPrice;
      },

      get tax() {
        return get().totalPrice * 0.08; // 8% 税率
      },

      get shipping() {
        const subtotal = get().subtotal;
        return subtotal > 50 ? 0 : 9.99; // 满$50免运费
      },

      get total() {
        return get().subtotal + get().tax + get().shipping;
      },

      // 添加商品到购物车
      addItem: (product, quantity = 1, variants = [], customization = null) => {
        const items = get().items;
        
        // 生成唯一的商品标识符
        const itemId = generateItemId(product._id, variants, customization);
        
        // 检查是否已存在相同的商品（包括变体和定制）
        const existingItemIndex = items.findIndex(item => item.id === itemId);
        
        if (existingItemIndex > -1) {
          // 如果存在，增加数量
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          // 如果不存在，添加新商品
          const newItem = {
            id: itemId,
            product,
            quantity,
            variants,
            customization,
            addedAt: new Date().toISOString()
          };
          set({ items: [...items, newItem] });
        }
      },

      // 更新商品数量
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        const items = get().items;
        const updatedItems = items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
      },

      // 移除商品
      removeItem: (itemId) => {
        const items = get().items;
        const updatedItems = items.filter(item => item.id !== itemId);
        set({ items: updatedItems });
      },

      // 清空购物车
      clearCart: () => {
        set({ items: [] });
      },

      // 获取商品数量
      getItemQuantity: (productId, variants = [], customization = null) => {
        const itemId = generateItemId(productId, variants, customization);
        const item = get().items.find(item => item.id === itemId);
        return item ? item.quantity : 0;
      },

      // 检查商品是否在购物车中
      isInCart: (productId, variants = [], customization = null) => {
        const itemId = generateItemId(productId, variants, customization);
        return get().items.some(item => item.id === itemId);
      },

      // 打开/关闭购物车侧边栏
      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      // 获取购物车摘要
      getCartSummary: () => {
        const state = get();
        return {
          totalItems: state.totalItems,
          totalPrice: state.totalPrice,
          subtotal: state.subtotal,
          tax: state.tax,
          shipping: state.shipping,
          total: state.total,
          itemCount: state.items.length
        };
      },

      // 验证购物车（检查库存、价格等）
      validateCart: async () => {
        const items = get().items;
        const validationResults = [];
        
        for (const item of items) {
          try {
            // 这里应该调用API验证商品信息
            // const response = await api.get(`/products/${item.product._id}`);
            // const currentProduct = response.data.product;
            
            // 暂时跳过API调用，直接返回有效
            validationResults.push({
              itemId: item.id,
              isValid: true,
              issues: []
            });
          } catch (error) {
            validationResults.push({
              itemId: item.id,
              isValid: false,
              issues: ['商品信息获取失败']
            });
          }
        }
        
        return validationResults;
      },

      // 应用优惠券
      applyCoupon: (couponCode) => {
        // 这里应该调用API验证优惠券
        // 暂时返回模拟结果
        return {
          success: false,
          message: '优惠券功能暂未实现'
        };
      },

      // 计算运费
      calculateShipping: (address) => {
        // 这里应该根据地址计算运费
        // 暂时返回固定运费
        const subtotal = get().subtotal;
        return subtotal > 50 ? 0 : 9.99;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

// 生成商品唯一标识符
function generateItemId(productId, variants = [], customization = null) {
  let id = productId;
  
  // 添加变体信息
  if (variants.length > 0) {
    const variantString = variants
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(v => `${v.name}:${v.value}`)
      .join('|');
    id += `_${variantString}`;
  }
  
  // 添加定制信息
  if (customization) {
    const customString = Object.entries(customization)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    id += `_custom:${customString}`;
  }
  
  return id;
}

export default useCartStore;
