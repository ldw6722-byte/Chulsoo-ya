import type { SubscriptionProduct, SellerSubscriptionStatus, AdminSellerMembership, StoreSubscriptionHistory, SellerSubscriptionTier } from '../types/api'
import { http, unwrap } from './client'
import type {
  AdminProduct,
  AdminAccount,
  AdminAccountListResponse,
  AdminStatus,
  EventCampaign,
  EventAsset,
  AdminOverview,
  AdminStoreActivity,
  AdminSupportInquiry,
  AdminWorkflowOrder,
  AdminUser,
  MemberProfile,
  UpdateMemberProfileRequest,
  CustomerCenterData,
  SupportFaqItem,
  SupportInquiry,
  SupportInquiryStatus,

  AssignedOrder,
    AuthenticatedUser,

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
  DevelopmentPaymentApprovalHistory,
  DevUser,
  Order,
  OrderStatus,
    OrderSummary,
  PaymentRefundView,
  SettlementSummary,
  SettlementRecord,

  PageResponse,
  Product,
  ProductPriceTier,
  RegionResolveResult,
  DeliveryAddress,
  DeliveryAddressRequest,
  PaymentMethod,
  RegisterPaymentMethodRequest,
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
  AdminStoreReviewNote,
  SellerApplication,
  AdminSellerApplication,
  AdminSellerApplicationDocuments, SellerDeactivationRequest,
  SellerApplicationStatus,
  SellerClaimAction,
  SubmitSellerApplicationRequest,
} from '@/types/api'

/* ?곸궠?얏틦?れ뿉?蹂μ쟽 */

export const catalogApi = {
  categories: () => unwrap<Category[]>(http.get('/categories')),

  categoryTree: () => unwrap<CategoryTreeNode[]>(http.get('/categories/tree')),
  eventCampaignHeroes: () => unwrap<EventCampaign[]>(http.get('/event-campaigns/hero')),
  eventCampaign: (id: number) => unwrap<EventCampaign>(http.get('/event-campaigns/' + id)),

  category: (code: string) => unwrap<CategoryTreeNode>(http.get(`/categories/${code}`)),

  products: (params: {
    categoryCode?: string
    keyword?: string
    eventCampaignId?: number
    page?: number
    size?: number
    sort?: 'popular' | 'newest' | 'priceAsc' | 'priceDesc' | 'rating' | 'name'
  }) => unwrap<PageResponse<Product>>(http.get('/products', { params })),

  featured: (size = 12) => unwrap<Product[]>(http.get('/products/featured', { params: { size } })),

  popular: (size = 12) => unwrap<Product[]>(http.get('/products/popular', { params: { size } })),

  suggestions: (keyword: string) => unwrap<string[]>(http.get('/products/suggestions', { params: { keyword } })),

  product: (id: number) => unwrap<Product>(http.get(`/products/${id}`)),
  priceTiers: (productId: number) => unwrap<ProductPriceTier[]>(http.get('/products/' + productId + '/price-tiers')),
}
export const cartApi = {
  view: () => unwrap<Cart>(http.get('/cart')),

  addItem: (productId: number, quantity: number, optionHash?: string, priceTierId?: number) =>
    unwrap<Cart>(http.post('/cart/items', { productId, quantity, optionHash, priceTierId })).then((cart) => { window.dispatchEvent(new Event('chulsooya:cart-updated')); return cart }),

  agreePriceTierSupply: () => unwrap<Cart>(http.post('/cart/price-tier-agreement')),
  setPriceTierAgreement: (agreed: boolean) => unwrap<Cart>(http.patch('/cart/price-tier-agreement', { agreed })),
  changeQuantity: (cartItemId: number, quantity: number) =>
    unwrap<Cart>(http.patch(`/cart/items/${cartItemId}`, { quantity })),

  removeItem: (cartItemId: number) => unwrap<Cart>(http.delete(`/cart/items/${cartItemId}`)),
  clear: () => unwrap<Cart>(http.delete('/cart')),
}

/* ?낅슣?뽪룇 鸚??롪퍒???*/

export const orderApi = {
  create: (payload: CreateOrderRequest) => unwrap<Order>(http.post('/orders', payload)),

  list: () => unwrap<OrderSummary[]>(http.get('/orders')),

  get: (orderId: number) => unwrap<Order>(http.get(`/orders/${orderId}`)),

    cancel: (orderId: number, idempotencyKey: string) => unwrap<Order>(http.post(`/orders/${orderId}/cancel`, undefined, { headers: { 'Idempotency-Key': idempotencyKey } })),

  payment: (orderId: number) => unwrap<PaymentRefundView>(http.get(`/orders/${orderId}/payment`)),

  confirmPayment: (orderId: number, idempotencyKey: string, method = 'CARD') =>
    unwrap<Order>(http.post('/payments/confirm', { orderId, idempotencyKey, method })),
}

/* 嶺뚯솘???*/

export const regionApi = {
  resolve: (address: string) =>
    unwrap<RegionResolveResult>(http.get('/regions/resolve', { params: { address } })),

  samples: () => unwrap<string[]>(http.get('/regions/samples')),
}

/* ???瑗??*/

export const deliveryAddressApi = {
  list: () => unwrap<DeliveryAddress[]>(http.get('/delivery-addresses')),
  create: (payload: DeliveryAddressRequest) => unwrap<DeliveryAddress>(http.post('/delivery-addresses', payload)),
  update: (addressId: number, payload: DeliveryAddressRequest) => unwrap<DeliveryAddress>(http.patch('/delivery-addresses/' + addressId, payload)),
  setDefault: (addressId: number) => unwrap<DeliveryAddress>(http.patch('/delivery-addresses/' + addressId + '/default')),
  remove: (addressId: number) => unwrap<void>(http.delete('/delivery-addresses/' + addressId)),
}

export const paymentMethodApi = {
  list: () => unwrap<PaymentMethod[]>(http.get('/payment-methods')),
  register: (payload: RegisterPaymentMethodRequest) => unwrap<PaymentMethod>(http.post('/payment-methods', payload)),
  remove: (paymentMethodId: number) => unwrap<void>(http.delete('/payment-methods/' + paymentMethodId)),
}

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

/* ?筌뤾쑴理?*/

export const authApi = {
  me: () => unwrap<AuthenticatedUser>(http.get('/auth/me')),
}

/* ?띠룇裕녻????ｌ뫒??*/

export const userApi = {
  list: () => unwrap<DevUser[]>(http.get('/users')),
  mine: () => unwrap<MemberProfile>(http.get('/users/me')),
  updateMine: (payload: UpdateMemberProfileRequest) => unwrap<MemberProfile>(http.patch('/users/me', payload)),
}


/* ??㉱?洹먮봿????怨멸껀 */
export const adminApi = {
  overview: () => unwrap<AdminOverview>(http.get('/admin/overview')),
  myAccount: () => unwrap<AdminAccount>(http.get('/admin/account/me')),
  updateMyAccountStatus: (status: AdminStatus) => unwrap<AdminAccount>(http.patch('/admin/account/me/status', { status })),
  administratorAccounts: () => unwrap<AdminAccountListResponse>(http.get('/admin/account')),
  inviteAdministrator: (payload: { email: string; name: string }) => unwrap<AdminAccount>(http.post('/admin/account/invite', payload)),
  listProducts: (params: { categoryCode?: string; keyword?: string; active?: boolean; page?: number; size?: number }) => unwrap<PageResponse<AdminProduct>>(http.get('/admin/products', { params })),
  createProduct: (payload: Omit<AdminProduct, 'id' | 'categoryName' | 'active'>) => unwrap<AdminProduct>(http.post('/admin/products', payload)),
  updateProduct: (id: number, payload: Omit<AdminProduct, 'id' | 'categoryName' | 'active'>) => unwrap<AdminProduct>(http.put('/admin/products/' + id, payload)),
  setProductActive: (id: number, active: boolean) => unwrap<AdminProduct>(http.patch('/admin/products/' + id + '/active', { active })),
  listEventCampaigns: () => unwrap<EventCampaign[]>(http.get('/admin/event-campaigns')),
  createEventCampaign: (payload: Omit<EventCampaign, 'id' | 'active'>) => unwrap<EventCampaign>(http.post('/admin/event-campaigns', payload)),
  updateEventCampaign: (id: number, payload: Omit<EventCampaign, 'id' | 'active'>) => unwrap<EventCampaign>(http.put('/admin/event-campaigns/' + id, payload)),
  setEventCampaignActive: (id: number, active: boolean) => unwrap<EventCampaign>(http.patch('/admin/event-campaigns/' + id + '/active', { active })),
  deleteEventCampaign: (id: number) => unwrap<void>(http.delete('/admin/event-campaigns/' + id)),
  listEventAssets: () => unwrap<EventAsset[]>(http.get('/admin/event-assets')),
  uploadEventAsset: (payload: { type: 'THEME' | 'ICON'; name: string; sourceType: 'ADMIN_UPLOAD' | 'AI_GENERATED'; sortOrder: number; file: File }) => { const form = new FormData(); form.append('type', payload.type); form.append('name', payload.name); form.append('sourceType', payload.sourceType); form.append('sortOrder', String(payload.sortOrder)); form.append('file', payload.file); return unwrap<EventAsset>(http.post('/admin/event-assets', form)) },
  updateEventAsset: (id: number, payload: { name: string; sortOrder: number; active: boolean }) => unwrap<EventAsset>(http.patch('/admin/event-assets/' + id, payload)),
  replaceEventAssetFile: (id: number, file: File) => { const form = new FormData(); form.append('file', file); return unwrap<EventAsset>(http.post('/admin/event-assets/' + id + '/file', form)) },
  deleteEventAsset: (id: number) => unwrap<void>(http.delete('/admin/event-assets/' + id)),

  priceTiers: (productId: number) => unwrap<ProductPriceTier[]>(http.get('/admin/products/' + productId + '/price-tiers')),
  createPriceTier: (productId: number, payload: Omit<ProductPriceTier, 'id'>) => unwrap<ProductPriceTier>(http.post('/admin/products/' + productId + '/price-tiers', payload)),
  updatePriceTier: (id: number, payload: Omit<ProductPriceTier, 'id'>) => unwrap<ProductPriceTier>(http.put('/admin/products/price-tiers/' + id, payload)),
  removePriceTier: (id: number) => unwrap<void>(http.delete('/admin/products/price-tiers/' + id)),
}

/* ??????鸚??筌먦끆??HOLD */
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
  developmentPending: () => unwrap<Order[]>(http.get('/admin/payments/development-pending')),
  developmentHistory: () => unwrap<DevelopmentPaymentApprovalHistory[]>(http.get('/admin/payments/development-history')),
  developmentApprove: (orderId: number) => unwrap<Order>(http.post(`/admin/payments/orders/${orderId}/development-approve`)),
  settlements: () => unwrap<SettlementRecord[]>(http.get('/admin/payments/settlements')),
  settlementSummary: () => unwrap<SettlementSummary>(http.get('/admin/payments/settlements/summary')), 
  refund: (paymentId: number, payload: { amount: number; reason: string; idempotencyKey: string }) => unwrap<PaymentRefundView>(http.post(`/admin/payments/${paymentId}/refunds`, payload)),
}

export const adminUserApi = {
  list: () => unwrap<AdminUser[]>(http.get('/admin/users')),
  changeRole: (userId: number, role: 'CONSUMER' | 'SELLER') => unwrap<AdminUser>(http.patch(`/admin/users/${userId}/role`, { role })),
}

/* ???瑗????ル―??鸚???驪??嶺뚯빘鍮??鸚???㉱?洹먮봿????亦?*/
export const sellerApplicationApi = {
  submit: (payload: SubmitSellerApplicationRequest) => unwrap<SellerApplication>(http.post('/seller-applications', payload)),
  mine: () => unwrap<SellerApplication>(http.get('/seller-applications/me')),
  uploadCertificate: (applicationId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return unwrap<SellerApplication>(http.post(`/seller-applications/${applicationId}/business-license`, form))
  },
  uploadBankAccountCopy: (applicationId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return unwrap<SellerApplication>(http.post(`/seller-applications/${applicationId}/bank-account-copy`, form))
  },
}

export const sellerDeactivationApi = {
  mine: () => unwrap<SellerDeactivationRequest | null>(http.get('/seller-deactivations/me')),
  request: (reason: string) => unwrap<SellerDeactivationRequest>(http.post('/seller-deactivations', { reason })),
}
export const adminSellerDeactivationApi = {
  pending: () => unwrap<SellerDeactivationRequest[]>(http.get('/admin/seller-deactivations')),
  approve: (requestId: number) => unwrap<SellerDeactivationRequest>(http.post('/admin/seller-deactivations/' + requestId + '/approve')),
  reject: (requestId: number, reason: string) => unwrap<SellerDeactivationRequest>(http.post('/admin/seller-deactivations/' + requestId + '/reject', { reason })),
}

export const adminSellerApplicationApi = {
  list: (status?: SellerApplicationStatus) => unwrap<AdminSellerApplication[]>(http.get('/admin/seller-applications', { params: status ? { status } : undefined })),
  documents: (applicationId: number) => unwrap<AdminSellerApplicationDocuments>(http.get(`/admin/seller-applications/${applicationId}/documents`)),
  approve: (applicationId: number) => unwrap<SellerApplication>(http.post(`/admin/seller-applications/${applicationId}/approve`)),
  reject: (applicationId: number, reason: string) => unwrap<AdminSellerApplication>(http.post(`/admin/seller-applications/${applicationId}/reject`, { reason })),
}

/* ???瑗???????鸚???㉱?洹먮봿????㉱??*/
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
  verificationDocuments: (storeId: number) => unwrap<AdminSellerApplicationDocuments>(http.get(`/admin/stores/${storeId}/verification-documents`)),
}

/* ??㉱?洹먮봿???낅슣?뽪룇 ??諛몃쭑?낅슣?딁뵳?鸚????瑗????怨멸껀 ??戮?꽑 */
export const adminWorkflowApi = {
  orders: () => unwrap<AdminWorkflowOrder[]>(http.get('/admin/workflow/orders')),
  storeActivity: (storeId: number) => unwrap<AdminStoreActivity>(http.get('/admin/stores/' + storeId + '/activity')),
  forceSlots: (storeId: number, payload: { configuredSlots: number; reason: string }) => unwrap<AdminStoreActivity>(http.post('/admin/stores/' + storeId + '/force-slots', payload)),
}

/* ??μ쪙????좎댉 鸚???쒖굣??鸚????逾?*/
export const storeReviewApi = {
  detail: (storeId: number) => unwrap<StoreDetail>(http.get(`/stores/${storeId}`)),
  create: (storeId: number, payload: { orderId: number; rating: number; comment: string }) =>
    unwrap<StoreReview>(http.post(`/stores/${storeId}/reviews`, payload)),
  adminList: () => unwrap<StoreReview[]>(http.get('/admin/store-reviews')),
  adminForStore: (storeId: number) => unwrap<StoreReview[]>(http.get(`/admin/stores/${storeId}/reviews`)),
  update: (reviewId: number, comment: string) => unwrap<StoreReview>(http.patch(`/admin/store-reviews/${reviewId}`, { comment })),
  adminNotesForStore: (storeId: number) => unwrap<AdminStoreReviewNote[]>(http.get(`/admin/stores/${storeId}/review-notes`)),
  createAdminNote: (storeId: number, content: string) => unwrap<AdminStoreReviewNote>(http.post(`/admin/stores/${storeId}/review-notes`, { content })),
  updateAdminNote: (noteId: number, content: string) => unwrap<AdminStoreReviewNote>(http.patch(`/admin/store-review-notes/${noteId}`, { content })),
  removeAdminNote: (noteId: number) => unwrap<void>(http.delete(`/admin/store-review-notes/${noteId}`)),
  adminReply: (reviewId: number, reply: string) => unwrap<StoreReview>(http.post(`/admin/store-reviews/${reviewId}/reply`, { reply })),
  clearReply: (reviewId: number) => unwrap<void>(http.delete(`/admin/store-reviews/${reviewId}/reply`)),
  remove: (reviewId: number) => unwrap<void>(http.delete(`/admin/store-reviews/${reviewId}`)),
  sellerList: () => unwrap<StoreReview[]>(http.get('/seller/reviews')),
  sellerReply: (reviewId: number, reply: string) => unwrap<StoreReview>(http.post(`/seller/store-reviews/${reviewId}/reply`, { reply })),
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

export const sellerSubscriptionApi = {
  products: () => unwrap<SubscriptionProduct[]>(http.get('/seller/subscription/products')),
  status: () => unwrap<SellerSubscriptionStatus>(http.get('/seller/subscription/status')),
  purchase: (productId: number) => unwrap<SellerSubscriptionStatus>(http.post('/seller/subscription/purchase', { productId })),
}
export const adminSubscriptionApi = {
  products: () => unwrap<SubscriptionProduct[]>(http.get('/admin/subscriptions/products')),
  createProduct: (payload: Omit<SubscriptionProduct, 'id'>) => unwrap<SubscriptionProduct>(http.post('/admin/subscriptions/products', payload)),
  updateProduct: (id: number, payload: Omit<SubscriptionProduct, 'id'>) => unwrap<SubscriptionProduct>(http.put('/admin/subscriptions/products/' + id, payload)),
  removeProduct: (id: number) => unwrap<void>(http.delete('/admin/subscriptions/products/' + id)),
  memberships: () => unwrap<AdminSellerMembership[]>(http.get('/admin/subscriptions/memberships')),
  changeMembership: (storeId: number, payload: { tier: SellerSubscriptionTier; expiresAt: string | null; reason?: string }) => unwrap<AdminSellerMembership>(http.post('/admin/subscriptions/stores/' + storeId + '/membership', payload)),
  history: (storeId: number) => unwrap<StoreSubscriptionHistory[]>(http.get('/admin/subscriptions/stores/' + storeId + '/history')),
}

