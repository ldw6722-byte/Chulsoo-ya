import { http, unwrap } from './client'
import type {
  AssignedOrder,
  AuthMeResponse,
  Cart,
  Category,
  CategoryTreeNode,
  CreateOrderRequest,
  DevUser,
  Order,
  OrderStatus,
  OrderSummary,
  PageResponse,
  Product,
  RegionResolveResult,
  SellerMetrics,
  SellerOffer,
  SellerStore,
  SlotLog,
} from '@/types/api'

/* 카탈로그 */

export const catalogApi = {
  categories: () => unwrap<Category[]>(http.get('/categories')),

  categoryTree: () => unwrap<CategoryTreeNode[]>(http.get('/categories/tree')),

  category: (code: string) => unwrap<CategoryTreeNode>(http.get(`/categories/${code}`)),

  products: (params: {
    categoryCode?: string
    keyword?: string
    page?: number
    size?: number
    sort?: 'popular' | 'newest' | 'priceAsc' | 'priceDesc' | 'rating' | 'name'
  }) => unwrap<PageResponse<Product>>(http.get('/products', { params })),

  featured: (size = 12) => unwrap<Product[]>(http.get('/products/featured', { params: { size } })),

  popular: (size = 12) => unwrap<Product[]>(http.get('/products/popular', { params: { size } })),

  suggestions: (keyword: string) => unwrap<string[]>(http.get('/products/suggestions', { params: { keyword } })),

  product: (id: number) => unwrap<Product>(http.get(`/products/${id}`)),
}

/* 장바구니 */

export const cartApi = {
  view: () => unwrap<Cart>(http.get('/cart')),

  addItem: (productId: number, quantity: number, optionHash?: string) =>
    unwrap<Cart>(http.post('/cart/items', { productId, quantity, optionHash })),

  changeQuantity: (cartItemId: number, quantity: number) =>
    unwrap<Cart>(http.patch(`/cart/items/${cartItemId}`, { quantity })),

  removeItem: (cartItemId: number) => unwrap<Cart>(http.delete(`/cart/items/${cartItemId}`)),
}

/* 주문 · 결제 */

export const orderApi = {
  create: (payload: CreateOrderRequest) => unwrap<Order>(http.post('/orders', payload)),

  list: () => unwrap<OrderSummary[]>(http.get('/orders')),

  get: (orderId: number) => unwrap<Order>(http.get(`/orders/${orderId}`)),

  cancel: (orderId: number) => unwrap<Order>(http.post(`/orders/${orderId}/cancel`)),

  confirmPayment: (orderId: number, idempotencyKey: string, method = 'CARD') =>
    unwrap<Order>(http.post('/payments/confirm', { orderId, idempotencyKey, method })),
}

/* 지역 */

export const regionApi = {
  resolve: (address: string) =>
    unwrap<RegionResolveResult>(http.get('/regions/resolve', { params: { address } })),

  samples: () => unwrap<string[]>(http.get('/regions/samples')),
}

/* 판매자 */

export const sellerApi = {
  store: () => unwrap<SellerStore>(http.get('/seller/store')),

  updateSlots: (configuredSlots: number, reason?: string) =>
    unwrap<SellerStore>(http.patch('/seller/store/slots', { configuredSlots, reason })),

  busyMode: () => unwrap<SellerStore>(http.post('/seller/store/busy-mode')),

  offers: () => unwrap<SellerOffer[]>(http.get('/seller/offers')),

  bid: (orderId: number) => unwrap<Order>(http.post(`/seller/offers/${orderId}/bid`)),

  decline: (orderId: number) => unwrap<string>(http.post(`/seller/offers/${orderId}/decline`)),

  assignedOrders: () => unwrap<AssignedOrder[]>(http.get('/seller/orders')),

  confirmStock: (orderId: number) =>
    unwrap<Order>(http.post(`/seller/orders/${orderId}/confirm-stock`)),

  advanceStatus: (orderId: number, next: OrderStatus) =>
    unwrap<Order>(http.post(`/seller/orders/${orderId}/status/${next}`)),

  metrics: () => unwrap<SellerMetrics>(http.get('/seller/metrics')),

  slotLogs: () => unwrap<SlotLog[]>(http.get('/seller/slot-logs')),
}

/* 인증 */

export const authApi = {
  me: () => unwrap<AuthMeResponse>(http.get('/auth/me')),
}

/* 개발용 계정 */

export const userApi = {
  list: () => unwrap<DevUser[]>(http.get('/users')),
}
