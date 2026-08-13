import { http, unwrap } from './client'
import type {
    AdminOverview,
  AdminStoreActivity,
  AdminSupportInquiry,
  AdminWorkflowOrder,
  AdminUser,
  CustomerCenterData,
  SupportFaqItem,
  SupportInquiry,
  SupportInquiryStatus,

  AssignedOrder,
  AuthMeResponse,
  Cart,
    Category,
  AdminClaimDecision,
  ClaimDetail,
  ClaimDecisionDocument,
  ClaimEvidence,
  ClaimStatus,
  ClaimSummary,
  ClaimType,
  CouponIssue,
  CouponPolicy,

  CategoryTreeNode,
  CreateOrderRequest,
  DevUser,
  Order,
  OrderStatus,
    OrderSummary,
  PaymentRefundView,

  PageResponse,
  Product,
  RegionResolveResult,
    SellerMetrics,
  SellerPenalty,

  SellerOffer,
  SellerStore,
  SlotLog,
  StoreCreateRequest,
  StoreDirectoryItem,
  StoreRegionOption,
  StoreUpdateRequest,
  StoreDetail,
  StoreReview,
  SellerApplication,
  AdminSellerApplication,
  SellerApplicationStatus,
  SellerClaimAction,
  SubmitSellerApplicationRequest,
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

    cancel: (orderId: number, idempotencyKey: string) => unwrap<Order>(http.post(`/orders/${orderId}/cancel`, undefined, { headers: { 'Idempotency-Key': idempotencyKey } })),

  payment: (orderId: number) => unwrap<PaymentRefundView>(http.get(`/orders/${orderId}/payment`)),

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

  penalties: () => unwrap<SellerPenalty[]>(http.get('/seller/penalties')),

}

/* 인증 */

export const authApi = {
  me: () => unwrap<AuthMeResponse>(http.get('/auth/me')),
}

/* 개발용 계정 */

export const userApi = {
  list: () => unwrap<DevUser[]>(http.get('/users')),
}


/* 관리자 운영 */
export const adminApi = {
  overview: () => unwrap<AdminOverview>(http.get('/admin/overview')),
}

/* 클레임 · 정산 HOLD */
export const couponApi = {
  mine: () => unwrap<{ issues: CouponIssue[] }>(http.get('/coupons/mine')),
}

export const adminCouponApi = {
  list: () => unwrap<CouponPolicy[]>(http.get('/admin/coupons')),
  create: (payload: { code: string; title: string; discountAmount: number; minimumOrderAmount: number; startsAt: string; expiresAt: string }) => unwrap<CouponPolicy>(http.post('/admin/coupons', payload)),
  issue: (couponId: number, consumerId: number) => unwrap<CouponIssue>(http.post(`/admin/coupons/${couponId}/issues`, { consumerId })),
}

export const claimApi = {
  create: (orderId: number, payload: { claimType: ClaimType; reasonCode: string; description: string }) => unwrap<ClaimSummary>(http.post(`/orders/${orderId}/claims`, payload)),
  mine: () => unwrap<ClaimSummary[]>(http.get('/claims')),
  detail: (claimId: number) => unwrap<ClaimDetail>(http.get(`/claims/${claimId}`)),
  uploadEvidence: (claimId: number, file: File) => { const form = new FormData(); form.append('file', file); return unwrap<ClaimEvidence>(http.post(`/claims/${claimId}/evidences`, form)) },
}

export const sellerClaimApi = {
  list: () => unwrap<ClaimSummary[]>(http.get('/seller/claims')),
  detail: (claimId: number) => unwrap<ClaimDetail>(http.get(`/seller/claims/${claimId}`)),
  action: (claimId: number, payload: { action: SellerClaimAction; note: string; trackingNumber?: string }) => unwrap<ClaimSummary>(http.post(`/seller/claims/${claimId}/actions`, payload)),
}

export const adminClaimApi = {
  list: (status: ClaimStatus = 'REQUESTED') => unwrap<ClaimSummary[]>(http.get('/admin/claims', { params: { status } })),
  detail: (claimId: number) => unwrap<ClaimDetail>(http.get(`/admin/claims/${claimId}`)),
  document: (claimId: number) => unwrap<ClaimDecisionDocument>(http.get(`/admin/claims/${claimId}/document`)),
  resolve: (claimId: number, payload: { decision: AdminClaimDecision; note: string; refundAmount?: number }) => unwrap<ClaimSummary>(http.post(`/admin/claims/${claimId}/resolve`, payload)),
}

export const adminPaymentApi = {
  refund: (paymentId: number, payload: { amount: number; reason: string; idempotencyKey: string }) => unwrap<PaymentRefundView>(http.post(`/admin/payments/${paymentId}/refunds`, payload)),
}

export const adminUserApi = {
  list: () => unwrap<AdminUser[]>(http.get('/admin/users')),
  changeRole: (userId: number, role: 'CONSUMER' | 'SELLER') => unwrap<AdminUser>(http.patch(`/admin/users/${userId}/role`, { role })),
}

/* 판매자 신청 · 사업자 증빙 · 관리자 심사 */
export const sellerApplicationApi = {
  submit: (payload: SubmitSellerApplicationRequest) => unwrap<SellerApplication>(http.post('/seller-applications', payload)),
  mine: () => unwrap<SellerApplication>(http.get('/seller-applications/me')),
  uploadCertificate: (applicationId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return unwrap<SellerApplication>(http.post(`/seller-applications/${applicationId}/business-license`, form))
  },
}

export const adminSellerApplicationApi = {
  list: (status?: SellerApplicationStatus) => unwrap<AdminSellerApplication[]>(http.get('/admin/seller-applications', { params: status ? { status } : undefined })),
  approve: (applicationId: number) => unwrap<SellerApplication>(http.post(`/admin/seller-applications/${applicationId}/approve`)),
  reject: (applicationId: number, reason: string) => unwrap<AdminSellerApplication>(http.post(`/admin/seller-applications/${applicationId}/reject`, { reason })),
}

/* 판매점 탐색 · 관리자 관리 */
export const storeDirectoryApi = {
  list: (params: { city?: string; district?: string } = {}) =>
    unwrap<StoreDirectoryItem[]>(http.get('/stores', { params })),
  regions: () => unwrap<StoreRegionOption[]>(http.get('/stores/regions')),
}
export const adminStoreApi = {
  list: () => unwrap<StoreDirectoryItem[]>(http.get('/admin/stores')),
  create: (payload: StoreCreateRequest) => unwrap<StoreDirectoryItem>(http.post('/admin/stores', payload)),
  update: (storeId: number, payload: StoreUpdateRequest) => unwrap<StoreDirectoryItem>(http.patch('/admin/stores/' + storeId, payload)),
  remove: (storeId: number) => unwrap<void>(http.delete('/admin/stores/' + storeId)),
}

/* 관리자 주문 생애주기 · 판매자 운영 제어 */
export const adminWorkflowApi = {
  orders: () => unwrap<AdminWorkflowOrder[]>(http.get('/admin/workflow/orders')),
  storeActivity: (storeId: number) => unwrap<AdminStoreActivity>(http.get('/admin/stores/' + storeId + '/activity')),
  forceSlots: (storeId: number, payload: { configuredSlots: number; reason: string }) => unwrap<AdminStoreActivity>(http.post('/admin/stores/' + storeId + '/force-slots', payload)),
}

/* 고객센터 · 문의 · 알림 */
export const storeReviewApi = {
  detail: (storeId: number) => unwrap<StoreDetail>(http.get(`/stores/${storeId}`)),
  create: (storeId: number, payload: { orderId: number; rating: number; comment: string }) =>
    unwrap<StoreReview>(http.post(`/stores/${storeId}/reviews`, payload)),
  adminList: () => unwrap<StoreReview[]>(http.get('/admin/store-reviews')),
  moderate: (reviewId: number, payload: { visible: boolean; reason?: string }) =>
    unwrap<StoreReview>(http.post(`/admin/store-reviews/${reviewId}/moderation`, payload)),
}

export const supportApi = {
  faqs: () => unwrap<SupportFaqItem[]>(http.get('/support/faqs')),
  center: () => unwrap<CustomerCenterData>(http.get('/support/center')),
  createInquiry: (payload: { category: string; title: string; content: string }) => unwrap<SupportInquiry>(http.post('/support/inquiries', payload)),
  markNotificationRead: (notificationId: number) => unwrap<void>(http.post('/support/notifications/' + notificationId + '/read')),
}

export const adminSupportApi = {
  inquiries: (status?: SupportInquiryStatus) => unwrap<AdminSupportInquiry[]>(http.get('/admin/support/inquiries', { params: status ? { status } : undefined })),
  reply: (inquiryId: number, reply: string) => unwrap<AdminSupportInquiry>(http.post('/admin/support/inquiries/' + inquiryId + '/reply', { reply })),
  changeStatus: (inquiryId: number, status: SupportInquiryStatus) => unwrap<AdminSupportInquiry>(http.post('/admin/support/inquiries/' + inquiryId + '/status', { status })),
}
