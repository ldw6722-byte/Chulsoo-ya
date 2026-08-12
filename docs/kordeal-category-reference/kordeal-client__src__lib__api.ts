import axios from 'axios';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// 공통 요청 함수 — 기존 fetch 래퍼와 동일한 시그니처 유지
async function request<T>(
  path: string,
  options?: { method?: string; body?: string; headers?: Record<string, string> }
): Promise<T> {
  const method = (options?.method || 'GET').toLowerCase() as
    | 'get' | 'post' | 'put' | 'patch' | 'delete';

  const data = options?.body ? JSON.parse(options.body) : undefined;

  const res = await apiClient.request<{ success: boolean; error?: string; data: T }>({
    method,
    url: path,
    data,
    headers: options?.headers,
  });

  if (!res.data.success && res.data.error) {
    throw new Error(res.data.error);
  }

  return res.data.data;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  imageUrl?: string;
  level: number;
  sortOrder: number;
  parentId?: number;
  children?: Category[];
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  stock: number;
  brand?: string;
  seller?: string;
  images: string[];
  thumbnail?: string;
  categoryId?: number;
  categoryName?: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  rocketDelivery: boolean;
  featured: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface Order {
  id: number;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  status: string;
  statusLabel: string;
  shippingAddress: string;
  shippingName: string;
  shippingPhone: string;
  paymentMethod?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  quantity: number;
  itemTotal: number;
  rocketDelivery: boolean;
  stock: number;
}

export interface Cart {
  items: CartItem[];
  totalCount: number;
  totalAmount: number;
}

// Category API
export const categoryAPI = {
  getTree: () => request<Category[]>('/categories/tree'),
  getAll: () => request<Category[]>('/categories'),
  getById: (id: number) => request<Category>(`/categories/${id}`),
  getChildren: (id: number) => request<Category[]>(`/categories/${id}/children`),
};

// Product API
export const productAPI = {
  getById: (id: number) => request<Product>(`/products/${id}`),
  getByCategory: (categoryId: number, page = 0, size = 20, sort = 'popular') =>
    request<PageResponse<Product>>(`/products/category/${categoryId}?page=${page}&size=${size}&sort=${sort}`),
  search: (q: string, page = 0, size = 20, sort = 'popular') =>
    request<PageResponse<Product>>(`/products/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}&sort=${sort}`),
  getSuggestions: (q: string) =>
    request<string[]>(`/products/search/suggestions?q=${encodeURIComponent(q)}`),
  getFeatured: (page = 0, size = 10) =>
    request<PageResponse<Product>>(`/products/featured?page=${page}&size=${size}`),
  getRocket: (page = 0, size = 10) =>
    request<PageResponse<Product>>(`/products/rocket?page=${page}&size=${size}`),
  getPopular: (page = 0, size = 10) =>
    request<PageResponse<Product>>(`/products/popular?page=${page}&size=${size}`),
  getNew: (page = 0, size = 10) =>
    request<PageResponse<Product>>(`/products/new?page=${page}&size=${size}`),
};

// Cart API
export const cartAPI = {
  getCart: (userId: number) => request<Cart>(`/cart/user/${userId}`),
  addToCart: (userId: number, productId: number, quantity = 1) =>
    request<Cart>(`/cart/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateQuantity: (userId: number, productId: number, quantity: number) =>
    request<Cart>(`/cart/user/${userId}/product/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeItem: (userId: number, productId: number) =>
    request<Cart>(`/cart/user/${userId}/product/${productId}`, { method: 'DELETE' }),
  clearCart: (userId: number) =>
    request<void>(`/cart/user/${userId}`, { method: 'DELETE' }),
  getCount: (userId: number) => request<number>(`/cart/user/${userId}/count`),
};

// Order API
export const orderAPI = {
  getOrders: (userId: number, page = 0, size = 10) =>
    request<PageResponse<Order>>(`/orders/user/${userId}?page=${page}&size=${size}`),
  getOrder: (orderId: number) => request<Order>(`/orders/${orderId}`),
  createOrder: (userId: number, data: {
    items: { productId: number; quantity: number }[];
    shippingAddress: string;
    shippingName: string;
    shippingPhone: string;
    paymentMethod?: string;
  }) =>
    request<Order>(`/orders/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancelOrder: (orderId: number, userId: number) =>
    request<Order>(`/orders/${orderId}/cancel/user/${userId}`, { method: 'PATCH' }),
};

// User API
export interface DbUser {
  id: number;
  email: string;
  name: string;
  profileImageUrl?: string;
  role: string;
  supabaseId: string;
}

export const userAPI = {
  sync: (data: { supabaseId: string; email: string; name?: string; profileImageUrl?: string }) =>
    request<DbUser>('/users/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBySupabaseId: (supabaseId: string) =>
    request<DbUser>(`/users/supabase/${supabaseId}`),
};

// axios 인스턴스 직접 접근이 필요한 경우를 위해 export
export { apiClient };
