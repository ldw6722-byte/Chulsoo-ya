package com.chulsooya.server.domain.order;

import java.time.Instant;
import java.util.List;

/** PG 비밀 응답은 제외하고 결제 잔액·환불 이력만 제공하는 조회 모델. */
public record PaymentRefundView(
        Long paymentId,
        String paymentStatus,
        int amount,
        int remainingAmount,
        String method,
        Instant paidAt,
        List<RefundEntry> refunds) {

    public static PaymentRefundView from(Payment payment, List<PaymentRefund> refunds) {
        return new PaymentRefundView(payment.getId(), payment.getStatus().name(), payment.getAmount(),
                payment.getRemainingAmount(), payment.getMethod(), payment.getPaidAt(),
                refunds.stream().map(RefundEntry::from).toList());
    }

    public record RefundEntry(Long id, String refundType, int amount, String reason, String status,
            Instant createdAt, Instant completedAt) {
        static RefundEntry from(PaymentRefund refund) {
            return new RefundEntry(refund.getId(), refund.getRefundType().name(), refund.getAmount(),
                    refund.getReason(), refund.getStatus().name(), refund.getCreatedAt(), refund.getCompletedAt());
        }
    }
}
