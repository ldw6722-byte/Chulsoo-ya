// 서버 계약 타입. 백엔드 DTO 와 1:1 로 대응한다.
// 서버: com.chulsooya.server.domain.*.*Dtos

export type UserRole = 'CONSUMER' | 'SELLER' | 'ADMIN'

export type OrderStatus =
  | 'DRAFT'
  | 'WAITING_MATCH'
  | 'MATCHED'
  | 'SELLER_CONFIRMING'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'DELIVERY_IN_PROGRESS'
  | 'PICKUP_READY'
  | 'COMPLETED'
  | 'MATCH_FAILED'
  | 'RE_MATCHING'
  | 'CANCELLED'

export type FulfillmentMethod = 'DELIVERY' | 'PICKUP'

export type SubscriptionTier = 'PREMIUM' | 'STANDARD' | 'FREE'

export interface ApiEnvelope<T> {
  data: T
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Category {
  id: number
  code: string
  name: string
  iconKey: string | null
  imageUrl: string | null
  level: 1 | 2 | 3
  parentCode: string | null
  sortOrder: number
}

export interface CategoryTreeNode {
  id: number
  code: string
  name: string
  iconKey: string | null
  imageUrl: string | null
  level: 1 | 2 | 3
  children: CategoryTreeNode[]
}

export interface Product {
  id: number
  name: string
  specSummary: string | null
  description: string | null
  specification: string | null
  price: number
  originalPrice: number | null
  discountRate: number | null
  unit: string | null
  imageUrl: string | null
  imageUrls: string[]
  brand: string | null
  rating: number
  reviewCount: number
  salesCount: number
  featured: boolean
  quickFulfillment: boolean
  categoryCode: string
  categoryName: string
}

export interface CartItem {
  id: number
  productId: number
  productName: string
  specSummary: string | null
  unit: string | null
  imageUrl: string | null
  optionHash: string
  quantity: number
  unitPrice: number
  lineAmount: number
}

export interface Cart {
  cartId: number | null
  items: CartItem[]
  itemsAmount: number
  itemCount: number
}

export interface OrderItem {
  id: number
  productId: number
  productName: string
  specSummary: string | null
  unit: string | null
  quantity: number
  priceAtOrder: number
  lineAmount: number
}

export interface Order {
  id: number
  status: OrderStatus
  fulfillmentMethod: FulfillmentMethod
  guCode: string
  address: string | null
  addressDetail: string | null
  requestMemo: string | null
  itemsAmount: number
  deliveryFee: number
  discountAmount: number
  totalAmount: number
  winningStoreId: number | null
  winningStoreName: string | null
  matchDeadlineAt: string | null
  sellerConfirmationDeadlineAt: string | null
  matchedAt: string | null
  sellerConfirmedAt: string | null
  paidAt: string | null
  completedAt: string | null
  retryCount: number
  createdAt: string
  /** 서버 시각. 클라이언트 카운트다운의 기준점. 기기 시간을 신뢰하지 않는다. */
  serverTime: string
  items: OrderItem[]
}

export interface OrderSummary {
  id: number
  status: OrderStatus
  totalAmount: number
  itemCount: number
  representativeProductName: string
  createdAt: string
}

export interface CreateOrderRequest {
  fulfillmentMethod: FulfillmentMethod
  address: string
  addressDetail?: string
  guCode: string
  requestMemo?: string
  discountAmount?: number
}

export interface RegionResolveResult {
  guCode: string
  guName: string
  normalizedAddress: string
}

export interface SellerStore {
  id: number
  name: string
  guCode: string
  address: string | null
  phone: string | null
  tier: SubscriptionTier
  tierSlotCap: number
  configuredSlots: number
  reservedSlots: number
  activeSlots: number
  availableSlots: number
  receivingOrders: boolean
  verified: boolean
  restrictedUntil: string | null
  trustScore: number
  serverTime: string
}

export interface OfferItemLine {
  productName: string
  specSummary: string | null
  quantity: number
  unit: string | null
}

export interface SellerOffer {
  offerId: number
  orderId: number
  orderStatus: OrderStatus
  fulfillmentMethod: FulfillmentMethod
  guCode: string
  addressMasked: string | null
  itemsAmount: number
  deliveryFee: number
  totalAmount: number
  itemCount: number
  lines: OfferItemLine[]
  offeredAt: string
  expiresAt: string
  serverTime: string
}

export interface AssignedOrder {
  orderId: number
  status: OrderStatus
  fulfillmentMethod: FulfillmentMethod
  addressMasked: string | null
  totalAmount: number
  itemCount: number
  lines: OfferItemLine[]
  sellerConfirmationDeadlineAt: string | null
  matchedAt: string | null
  serverTime: string
}

export interface SellerMetrics {
  receivedOffers: number
  wonBids: number
  missedOrders: number
  matchSuccessRate: number
  trustScore: number
}

export interface SlotLog {
  id: number
  oldConfiguredSlots: number
  newConfiguredSlots: number
  changedBy: string
  reason: string | null
  createdAt: string
}

export interface DevUser {
  id: number
  email: string
  name: string
  role: UserRole
}

/** Supabase JWT 검증 뒤 Spring Boot가 반환하는 철수야 내부 사용자 프로필. */
export interface AuthenticatedUser {
  id: number
  supabaseUserId: string
  email: string
  name: string
  role: UserRole
}

export interface AuthMeResponse {
  user: AuthenticatedUser
}


export interface AdminOverview {
  summary: {
    todayOrderCount: number
    matchingOrderCount: number
    totalProductCount: number
    totalUserCount: number
    sellerCount: number
    verifiedStoreCount: number
    todayRevenue: number
    attentionStoreCount: number
  }
  orderStatusCounts: Record<string, number>
  recentOrders: Array<{
    id: number
    status: OrderStatus
    representativeProductName: string
    totalAmount: number
    itemCount: number
    winningStoreName: string | null
    createdAt: string
  }>
  storeAttention: Array<{
    id: number
    name: string
    guCode: string
    state: string
    availableSlots: number
    trustScore: number
    restrictedUntil: string | null
  }>
  serverTime: string
}

export interface StoreDirectoryItem {
  id: number
  name: string
  cityName: string
  districtName: string
  address: string
  phone: string
  imageUrl: string | null
  handledItems: string[]
  rating: number
  verified: boolean
  receivingOrders: boolean
  restricted: boolean
  availableSlots: number
  tier: 'FREE' | 'STANDARD' | 'PREMIUM'
  ownerEmail: string
}

export interface StoreRegionOption {
  cityName: string
  districtName: string
}

export interface StoreCreateRequest {
  name: string
  ownerEmail: string
  ownerName: string
  phone: string
  cityName: string
  districtName: string
  address: string
  imageUrl: string
  handledItems: string
  rating: number
  verified: boolean
  receivingOrders: boolean
}

export interface StoreUpdateRequest {
  name: string
  phone: string
  cityName: string
  districtName: string
  address: string
  imageUrl: string
  handledItems: string
  rating: number
  verified: boolean
  receivingOrders: boolean
}

export interface WorkflowTimelineEvent {
  type: string
  label: string
  occurredAt: string
  detail: string
}

export interface AdminWorkflowOrder {
  orderId: number
  status: string
  consumerName: string
  storeName: string | null
  districtCode: string
  totalAmount: number
  itemCount: number
  offerCount: number
  bidCount: number
  createdAt: string
  matchDeadlineAt: string | null
  sellerConfirmationDeadlineAt: string | null
  matchedAt: string | null
  sellerConfirmedAt: string | null
  paidAt: string | null
  completedAt: string | null
  timeline: WorkflowTimelineEvent[]
}

export interface AdminSlotLog {
  createdAt: string
  oldSlots: number
  newSlots: number
  changedBy: string
  reason: string | null
}

export interface AdminStoreActivity {
  storeId: number
  storeName: string
  districtCode: string
  configuredSlots: number
  reservedSlots: number
  activeSlots: number
  availableSlots: number
  receivingOrders: boolean
  verified: boolean
  trustScore: number
  slotLogs: AdminSlotLog[]
  assignedOrders: AdminWorkflowOrder[]
}
