package com.chulsooya.server.domain.order;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.coupon.CouponService;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class PaymentRefundService {

    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final PaymentRefundRepository refunds;
    private final StoreRepository stores;
    private final CouponService couponService;
    private final Clock clock;

    public PaymentRefundService(OrderRepository orders, PaymentRepository payments,
            PaymentRefundRepository refunds, StoreRepository stores, CouponService couponService, Clock clock) {
        this.orders = orders;
        this.payments = payments;
        this.refunds = refunds;
        this.stores = stores;
        this.couponService = couponService;
        this.clock = clock;
    }

    /** 결제 전 취소와 결제 직후 전액 취소를 하나의 소비자 액션으로 처리한다. */
    @Transactional
    public Order cancelByConsumer(Long orderId, Long consumerId, String idempotencyKey) {
        Instant now = clock.instant();
        Order order = requireOrderForUpdate(orderId);
        if (!order.getConsumerId().equals(consumerId)) throw new DomainException(ErrorCode.FORBIDDEN);

        Payment payment = payments.findByOrderIdForUpdate(orderId).orElse(null);
        if (payment == null) {
            cancelOrderAndReleaseSlot(order, now);
            couponService.restoreAfterOrderCancellation(order, consumerId);
            return order;
        }
        requireIdempotencyKey(idempotencyKey);
        if (refunds.findByIdempotencyKey(idempotencyKey).isPresent()) return order;
        if (order.getStatus() != OrderStatus.PAID || payment.getStatus() != Payment.Status.PAID) {
            throw new DomainException(ErrorCode.REFUND_NOT_ALLOWED);
        }

        PaymentRefund refund = new PaymentRefund(payment.getId(), order.getId(), RefundType.CANCEL,
                payment.getRemainingAmount(), "고객 결제 취소", idempotencyKey, consumerId, now);
        refunds.save(refund);
        payment.cancelFull();
        refund.markSucceeded(consumerId, stubCancelKey(), "개발 결제 취소 승인", now);
        cancelOrderAndReleaseSlot(order, now);
        couponService.restoreAfterOrderCancellation(order, consumerId);
        return order;
    }

    /** 관리자만 반품·분쟁 확정 뒤 전액 또는 부분 환불을 수행한다. */
    @Transactional
    public PaymentRefund refundByAdmin(CurrentUser actor, Long paymentId, int amount, String reason,
            String idempotencyKey) {
        if (actor.role() != UserRole.ADMIN) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
        requireIdempotencyKey(idempotencyKey);
        PaymentRefund existing = refunds.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existing != null) return existing;

        Payment paymentReference = payments.findById(paymentId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "결제 정보를 찾을 수 없습니다."));
        // 모든 취소·환불은 주문 → 결제 순서로 잠가 교착 가능성을 제거한다.
        Order order = requireOrderForUpdate(paymentReference.getOrderId());
        Payment payment = payments.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "결제 정보를 찾을 수 없습니다."));
        if (order.getStatus() != OrderStatus.PAID && order.getStatus() != OrderStatus.PREPARING) {
            throw new DomainException(ErrorCode.REFUND_NOT_ALLOWED);
        }
        if (payment.getStatus() != Payment.Status.PAID && payment.getStatus() != Payment.Status.PARTIAL_REFUNDED) {
            throw new DomainException(ErrorCode.REFUND_NOT_ALLOWED);
        }
        if (amount <= 0 || amount > payment.getRemainingAmount()) {
            throw new DomainException(ErrorCode.REFUND_AMOUNT_EXCEEDED);
        }

        Instant now = clock.instant();
        PaymentRefund refund = new PaymentRefund(payment.getId(), order.getId(), RefundType.REFUND,
                amount, reason, idempotencyKey, actor.userId(), now);
        refunds.save(refund);
        payment.applyRefund(amount);
        refund.markSucceeded(actor.userId(), stubCancelKey(), "개발 환불 승인", now);
        if (payment.getRemainingAmount() == 0) cancelOrderAndReleaseSlot(order, now);
        return refund;
    }

    /** 클레임 관리자 결정 전용 환불. 완료 주문은 거래 상태를 되돌리지 않고 결제·환불 이력만 종결한다. */
    @Transactional
    public PaymentRefund refundForApprovedClaim(CurrentUser actor, Long paymentId, int amount, String reason,
            String idempotencyKey) {
        if (actor.role() != UserRole.ADMIN) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
        requireIdempotencyKey(idempotencyKey);
        PaymentRefund existing = refunds.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existing != null) return existing;

        Payment paymentReference = payments.findById(paymentId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "결제 정보를 찾을 수 없습니다."));
        Order order = requireOrderForUpdate(paymentReference.getOrderId());
        Payment payment = payments.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "결제 정보를 찾을 수 없습니다."));
        if (payment.getStatus() != Payment.Status.PAID && payment.getStatus() != Payment.Status.PARTIAL_REFUNDED) {
            throw new DomainException(ErrorCode.REFUND_NOT_ALLOWED);
        }
        if (amount <= 0 || amount > payment.getRemainingAmount()) {
            throw new DomainException(ErrorCode.REFUND_AMOUNT_EXCEEDED);
        }

        Instant now = clock.instant();
        PaymentRefund refund = new PaymentRefund(payment.getId(), order.getId(), RefundType.REFUND,
                amount, reason, idempotencyKey, actor.userId(), now);
        refunds.save(refund);
        payment.applyRefund(amount);
        refund.markSucceeded(actor.userId(), stubCancelKey(), "클레임 환불 승인", now);
        if (payment.getRemainingAmount() == 0 && !order.getStatus().isTerminal()) {
            cancelOrderAndReleaseSlot(order, now);
        }
        return refund;
    }

    @Transactional(readOnly = true)
    public PaymentRefundView paymentView(Long orderId, Long requesterId, boolean admin) {
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!admin && !order.getConsumerId().equals(requesterId)) throw new DomainException(ErrorCode.FORBIDDEN);
        Payment payment = payments.findByOrderId(orderId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "결제 정보를 찾을 수 없습니다."));
        return PaymentRefundView.from(payment, refunds.findByPaymentIdOrderByCreatedAtDesc(payment.getId()));
    }

    private Order requireOrderForUpdate(Long orderId) {
        return orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
    }

    private void cancelOrderAndReleaseSlot(Order order, Instant now) {
        order.cancel(now);
        if (order.getWinningStoreId() != null) {
            stores.findByIdForUpdate(order.getWinningStoreId()).ifPresent(Store::releaseActiveSlot);
        }
    }

    private void requireIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new DomainException(ErrorCode.IDEMPOTENCY_KEY_REQUIRED);
        }
    }

    private String stubCancelKey() {
        // ponytail: 개발 PG 스텁. upgrade path: 서버 전용 PG 취소 API 응답 키로 대체.
        return "stub_cancel_" + UUID.randomUUID();
    }
}
