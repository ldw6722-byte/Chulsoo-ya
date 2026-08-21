// ??뺤쒔 ?④쑴鍮????? 獄쏄퉮肉??DTO ?? 1:1 嚥????臾볥립??
// ??뺤쒔: com.chulsooya.server.domain.*.*Dtos

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

export interface ProductPriceTier { id: number; label: string; salePrice: number; guideBrands: string; guideMessage: string; sortOrder?: number; active?: boolean }
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
  selectPromotion: boolean
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
  priceTierId: number
  priceTierLabel: string
  priceTierBrands: string
  quantity: number
  unitPrice: number
  lineAmount: number
}


export interface Cart {
  cartId: number | null
  items: CartItem[]
  itemsAmount: number
  itemCount: number
  priceTierAgreed: boolean
}

export interface OrderItem {
  id: number
  productId: number
  productName: string
  specSummary: string | null
  unit: string | null
  quantity: number
  priceAtOrder: number
  priceTierLabel?: string | null
  priceTierBrands?: string | null
  priceTierAgreed?: boolean
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
  couponIssueId: number | null
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
  /** ??뺤쒔 ??볦퍟. ?????곷섧??燁삳똻??紐껊뼄??곸벥 疫꿸퀣??? 疫꿸퀗由???볦퍢???醫듚??? ??낅뮉?? */
  serverTime: string
  items: OrderItem[]
}

export interface DevelopmentPaymentApprovalHistory {
  order: Order
  paymentStatus: 'READY' | 'PAID' | 'CANCEL_PENDING' | 'CANCELLED' | 'REFUNDING' | 'PARTIAL_REFUNDED' | 'REFUNDED'
  method: string
  transactionKey: string | null
  approvedAt: string | null
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
  couponIssueId?: number
}

export interface RegionResolveResult {
  guCode: string
  guName: string
  normalizedAddress: string
}

export type StoreOperatingStatus = 'OPEN' | 'PREPARING' | 'CLOSED' | 'HOLIDAY'

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
  directions: string | null
  businessOpenTime: string
  businessCloseTime: string
  weeklyClosedDays: string[]
  temporaryClosed: boolean
  operatingStatus: StoreOperatingStatus
}

export interface UpdateStoreOperationsRequest {
  directions: string
  businessOpenTime: string
  businessCloseTime: string
  weeklyClosedDays: string[]
  temporaryClosed: boolean
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

/** Supabase JWT 野꺜筌???Spring Boot揶쎛 獄쏆꼹???롫뮉 筌ｌ쥙?????? ??????袁⑥쨮?? */
export interface AuthenticatedUser {
  id: number
  supabaseUserId: string
  email: string
  name: string
  role: UserRole
  adminLevel: AdminLevel
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
  directoryVisible: boolean
    customerBadgeText: string | null
  customerNoticeText: string | null
  directions: string | null
  businessOpenTime: string
  businessCloseTime: string
  weeklyClosedDays: string[]
  temporaryClosed: boolean
  operatingStatus: StoreOperatingStatus
  restricted: boolean

  availableSlots: number
  tier: SellerSubscriptionTier
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
  directoryVisible: boolean
    customerBadgeText: string
  customerNoticeText: string
  directions: string
  businessOpenTime: string
  businessCloseTime: string
  weeklyClosedDays: string[]
  temporaryClosed: boolean
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
  directoryVisible: boolean
    customerBadgeText: string
  customerNoticeText: string
  directions: string
  businessOpenTime: string
  businessCloseTime: string
  weeklyClosedDays: string[]
  temporaryClosed: boolean
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
  penalties: Array<{
    orderId: number
    violationType: string
    level: number
    trustScoreDelta: number
    restrictionUntil: string | null
    reason: string
    appliedAt: string
  }>
  assignedOrders: AdminWorkflowOrder[]
}

export type SupportInquiryStatus = 'OPEN' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED'

export interface SupportFaqItem {
  category: string
  question: string
  answer: string
}

export interface SupportInquiry {
  id: number
  category: string
  title: string
  content: string
  status: SupportInquiryStatus
  adminReply: string | null
  answeredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomerNotification {
  id: number
  type: string
  title: string
  content: string
  targetPath: string | null
  readAt: string | null
  createdAt: string
}

export interface CustomerCenterData {
  faqs: SupportFaqItem[]
  inquiries: SupportInquiry[]
  notifications: CustomerNotification[]
}

export interface AdminSupportInquiry extends SupportInquiry {
  consumerId: number
  consumerName: string
}

export type StoreReviewVisibility = 'PUBLISHED' | 'HIDDEN'

export interface StoreReview {
  id: number
  storeId: number
  orderId: number
  consumerName: string
  rating: number
  comment: string
  trustDelta: number
  visibility: StoreReviewVisibility
  moderationReason: string | null
  sellerReply: string | null
  sellerRepliedAt: string | null
  createdAt: string
  moderatedAt: string | null
}

export interface AdminStoreReviewNote {
  id: number
  storeId: number
  authorId: number
  content: string
  createdAt: string
  updatedAt: string
}

export interface StoreReviewEligibility {
  eligible: boolean
  reason: string
  orderId: number | null
  expiresAt: string | null
}

export interface StoreDetail {
  store: StoreDirectoryItem
  reviews: StoreReview[]
  reviewCount: number
  averageRating: number
  eligibility: StoreReviewEligibility
}

export interface FeaturePermissionView {
  code: string
  label: string
  group: 'CONSUMER' | 'SELLER' | 'ADMIN'
  enabled: boolean
}

export interface AdminUser {

  id: number
  email: string
  name: string
  phone: string | null
    role: UserRole
  adminLevel: 'HIGHEST' | 'STANDARD' | 'NONE'
  createdAt: string
}

export interface MemberProfile {

  id: number
  email: string
  name: string
  phone: string | null
  role: UserRole
  createdAt: string
}

export interface UpdateMemberProfileRequest {
  name: string
  phone: string
}

export type SellerApplicationStatus = 'PENDING' | 'MANUAL_REVIEW' | 'APPROVED' | 'REJECTED'
export type NtsVerificationStatus = 'NOT_REQUESTED' | 'VERIFIED' | 'MISMATCH' | 'UNAVAILABLE'

export interface SubmitSellerApplicationRequest {
  storeName: string
  representativeName: string
  businessRegistrationNumber: string
  businessOpenedOn?: string
  cityName: string
  districtName: string
  address: string
  phone: string
  handledItems?: string
}

export interface SellerApplication {
  id: number
  storeName: string
  cityName: string
  districtName: string
  address: string
  phone: string
  handledItems: string[]
  status: SellerApplicationStatus
  ntsStatus: NtsVerificationStatus
  certificateSubmitted: boolean
  bankAccountCopySubmitted: boolean
  submittedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
}

export interface AdminSellerApplication extends SellerApplication {
  applicantUserId: number
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  representativeName: string
  businessRegistrationNumber: string
  businessRegistrationNumberMasked: string
  businessOpenedOn: string | null
  ntsMessage: string | null
  reviewedByUserId: number | null
}

export interface SellerVerificationDocument {
  type: 'BUSINESS_LICENSE' | 'BANK_ACCOUNT_COPY'
  label: string
  submitted: boolean
  contentType: string | null
  sizeBytes: number | null
  signedUrl: string | null
}
export interface AdminSellerApplicationDocuments {
  applicationId: number
  businessLicense: SellerVerificationDocument
  bankAccountCopy: SellerVerificationDocument
}

export interface SellerPenalty {
  id: number
  orderId: number
  violationType: 'SELLER_CONFIRMATION_TIMEOUT'
  level: number
  trustScoreDelta: number
  restrictionUntil: string | null
  reason: string
  appliedAt: string
}

export type PaymentStatus = 'READY' | 'PAID' | 'CANCEL_PENDING' | 'CANCELLED' | 'REFUNDING' | 'PARTIAL_REFUNDED' | 'REFUNDED'

export interface PaymentRefundEntry {
  id: number
  refundType: 'CANCEL' | 'REFUND'
  amount: number
  reason: string
  status: 'REQUESTED' | 'SUCCEEDED' | 'FAILED'
  createdAt: string
  completedAt: string | null
}

export interface PaymentRefundView {
  paymentId: number
  paymentStatus: PaymentStatus
  amount: number
  remainingAmount: number
  method: string | null
  paidAt: string | null
  refunds: PaymentRefundEntry[]
}

export type ClaimType = 'RETURN' | 'EXCHANGE' | 'PARTIAL_REPLACEMENT'
export type ClaimStatus = 'REQUESTED' | 'SELLER_REVIEWING' | 'PICKUP_SCHEDULED' | 'REPLACEMENT_SHIPPING' | 'ESCALATED' | 'RESOLVED' | 'REJECTED'
export type SellerClaimAction = 'ACKNOWLEDGE' | 'SCHEDULE_PICKUP' | 'SHIP_REPLACEMENT' | 'ESCALATE'
export type AdminClaimDecision = 'RESOLVE_NO_REFUND' | 'FULL_REFUND' | 'REJECT'

export interface ClaimSummary {
  id: number
  orderId: number
  claimType: ClaimType
  reasonCode: string
  description: string
  status: ClaimStatus
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export interface ClaimEvidence {
  id: number
  contentType: string
  byteSize: number
  createdAt: string
}

export interface ClaimEvent {
  id: number
  eventType: string
  actorRole: string
  detail: string
  createdAt: string
}

export interface ClaimDetail {
  claim: ClaimSummary
  settlementStatus: 'PENDING' | 'HOLD' | 'RELEASABLE' | 'SETTLED' | 'CANCELLED'
  holdReason: string | null
  evidences: ClaimEvidence[]
  events: ClaimEvent[]
}

export type CouponIssueStatus = 'AVAILABLE' | 'APPLIED' | 'EXPIRED' | 'CANCELLED'

export interface CouponIssue {
  issueId: number
  couponId: number
  code: string
  title: string
  discountAmount: number
  minimumOrderAmount: number
  status: CouponIssueStatus
  issuedAt: string
  expiresAt: string
  appliedOrderId: number | null
}

export interface CouponPolicy {
  id: number
  code: string
  title: string
  discountAmount: number
  minimumOrderAmount: number
  startsAt: string
  expiresAt: string
  active: boolean
  createdAt: string
}

export interface ClaimDecisionDocument {
  documentNumber: string
  content: string
}

export interface AdminProduct { id:number; categoryCode:string; categoryName:string; name:string; specSummary:string; description:string|null; specification:string|null; price:number; originalPrice:number|null; supplyCost:number|null; discountRate:number|null; selectPromotion:boolean; eventCampaignId:number|null; unit:string; imageUrl:string|null; brand:string|null; featured:boolean; quickFulfillment:boolean; active:boolean }

export interface EventCampaign {
  id: number
  name: string
  heroTitle: string
  heroSubtitle: string | null
  badgeText: string
  ctaText: string
  themeKey: string
  iconKey: string
  themeAssetId?: number | null
  iconAssetId?: number | null
  themeImageUrl?: string | null
  iconImageUrl?: string | null
  heroSort: number
  active: boolean
  heroEnabled: boolean
}
export interface EventAsset {
  id: number
  assetType: 'THEME' | 'ICON'
  name: string
  publicUrl: string
  sourceType: 'ADMIN_UPLOAD' | 'AI_GENERATED'
  sortOrder: number
  active: boolean
}
export interface EventAsset { id:number; assetType:'THEME'|'ICON'; name:string; publicUrl:string; sourceType:'ADMIN_UPLOAD'|'AI_GENERATED'; sortOrder:number; active:boolean }

export interface DeliveryAddress {
  id: number
  label: string
  recipientName: string
  recipientPhone: string
  cityName: string
  districtName: string
  roadAddress: string
  addressDetail: string | null
  fullAddress: string
  defaultAddress: boolean
  createdAt: string
  updatedAt: string
}

export interface DeliveryAddressRequest {
  label: string
  recipientName: string
  recipientPhone: string
  cityName: string
  districtName: string
  roadAddress: string
  addressDetail?: string
  defaultAddress: boolean
}

export type PaymentMethodType = 'BANK_ACCOUNT' | 'CARD'

export interface PaymentMethod {
  id: number
  methodType: PaymentMethodType
  providerName: string
  maskedLabel: string
  createdAt: string
}

export interface RegisterPaymentMethodRequest {
  methodType: PaymentMethodType
  providerName: string
  lastFour: string
}


export interface SettlementSummary {
  grossAmount: number
  commissionAmount: number
  refundedAmount: number
  sellerPayableAmount: number
  pendingCount: number
  holdCount: number
}

export interface SettlementRecord {
  id: number
  orderId: number
  storeId: number
  storeName: string | null
  paymentId: number
  grossAmount: number
  commissionRateBps: number
  commissionAmount: number
  refundedAmount: number
  sellerPayableAmount: number
  paymentStatus: PaymentStatus
  status: 'PENDING' | 'HOLD' | 'RELEASABLE' | 'SETTLED' | 'CANCELLED'
  holdReason: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SellerDeactivationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export interface SellerDeactivationRequest { id: number; sellerUserId: number; sellerName: string; sellerEmail: string; status: SellerDeactivationStatus; reason: string | null; requestedAt: string; reviewedAt: string | null; rejectionReason: string | null }

export type SellerSubscriptionTier = 'PREMIUM' | 'GOLD' | 'SILVER'
export type SubscriptionHistoryEvent = 'PURCHASED' | 'ADMIN_CHANGED' | 'EXPIRED'
export interface SubscriptionProduct { id: number; name: string; tier: SellerSubscriptionTier; price: number; durationMonths: number; description: string | null; active: boolean; displayOrder: number }
export interface StoreSubscriptionHistory { id: number; productId: number | null; previousTier: SellerSubscriptionTier; nextTier: SellerSubscriptionTier; previousExpiresAt: string | null; expiresAt: string | null; eventType: SubscriptionHistoryEvent; changedByUserId: number | null; reason: string | null; createdAt: string }
export interface SellerSubscriptionStatus { storeId: number; storeName: string; tier: SellerSubscriptionTier; subscriptionExpiresAt: string | null; activePaidMembership: boolean; history: StoreSubscriptionHistory[] }
export interface AdminSellerMembership { storeId: number; storeName: string; ownerEmail: string; districtName: string | null; handledItems: string | null; tier: SellerSubscriptionTier; subscriptionExpiresAt: string | null; activePaidMembership: boolean; configuredSlots: number; tierSlotCap: number }


export type AdminLevel = 'NONE' | 'HIGHEST' | 'STANDARD'
export type AdminStatus = 'WORKING' | 'AWAY' | 'OFFLINE'

export interface AdminAccount {
  id: number
  email: string
  name: string
  roleLabel: '최고 관리자' | '일반 관리자'
  statusLabel: '근무 중' | '자리 비움' | '업무 종료'
  level: AdminLevel
  status: AdminStatus
  statusUpdatedAt: string | null
}

export interface AdminAccountListResponse {
  accounts: AdminAccount[]
}
