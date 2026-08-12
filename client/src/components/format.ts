import type { OrderStatus } from '@/types/api'

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface StatusMeta {
  label: string
  badge: string
  description: string
}

/** 상태를 색상만으로 전달하지 않기 위해 항상 텍스트 레이블을 함께 제공한다. */
export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  DRAFT: { label: '작성 중', badge: 'badge-neutral', description: '주문이 아직 요청되지 않았습니다.' },
  WAITING_MATCH: {
    label: '매칭 대기',
    badge: 'badge-primary',
    description: '지역 판매자에게 주문을 제안했습니다. 최대 5분간 대기합니다.',
  },
  MATCHED: { label: '판매자 배정', badge: 'badge-primary', description: '판매자가 배정되었습니다.' },
  SELLER_CONFIRMING: {
    label: '물품 확인 중',
    badge: 'badge-warning',
    description: '판매자가 2분 내에 물품 보유 여부를 확인합니다.',
  },
  PAYMENT_PENDING: {
    label: '결제 대기',
    badge: 'badge-warning',
    description: '물품 확인이 완료되었습니다. 결제를 진행해 주세요.',
  },
  PAID: { label: '결제 완료', badge: 'badge-success', description: '결제가 완료되었습니다.' },
  PREPARING: { label: '준비 중', badge: 'badge-info', description: '판매자가 상품을 준비하고 있습니다.' },
  DELIVERY_IN_PROGRESS: { label: '배달 중', badge: 'badge-info', description: '배달이 진행 중입니다.' },
  PICKUP_READY: { label: '픽업 준비 완료', badge: 'badge-info', description: '매장에서 픽업할 수 있습니다.' },
  COMPLETED: { label: '완료', badge: 'badge-success', description: '거래가 완료되었습니다.' },
  MATCH_FAILED: {
    label: '매칭 실패',
    badge: 'badge-danger',
    description: '현재 주변 업체가 모두 작업 중입니다. 재시도하거나 예약 주문으로 전환할 수 있습니다.',
  },
  RE_MATCHING: { label: '재매칭 중', badge: 'badge-warning', description: '다른 판매자를 찾고 있습니다.' },
  CANCELLED: { label: '취소', badge: 'badge-neutral', description: '주문이 취소되었습니다.' },
}

export function tierLabel(tier: 'PREMIUM' | 'STANDARD' | 'FREE'): string {
  return { PREMIUM: '프리미엄 구독', STANDARD: '일반 구독', FREE: '무료/신규' }[tier]
}
