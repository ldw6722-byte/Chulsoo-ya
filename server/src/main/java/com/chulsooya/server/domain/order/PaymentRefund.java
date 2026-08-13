package com.chulsooya.server.domain.order;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 결제 취소·환불의 요청과 PG 처리 결과를 보존하는 감사 이력. */
@Entity
@Getter
@Table(name = "refunds")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentRefund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long paymentId;

    @Column(nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RefundType refundType;

    @Column(nullable = false)
    private int amount;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RefundStatus status = RefundStatus.REQUESTED;

    @Column(nullable = false)
    private Long requestedByUserId;

    private Long processedByUserId;

    @Column(length = 120)
    private String pgCancelKey;

    @Column(length = 500)
    private String pgResponseMessage;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant completedAt;

    @Version
    private Long version;

    public PaymentRefund(Long paymentId, Long orderId, RefundType refundType, int amount, String reason,
            String idempotencyKey, Long requestedByUserId, Instant createdAt) {
        if (amount <= 0) throw new IllegalArgumentException("환불 금액은 0보다 커야 합니다.");
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.refundType = refundType;
        this.amount = amount;
        this.reason = required(reason);
        this.idempotencyKey = required(idempotencyKey);
        this.requestedByUserId = requestedByUserId;
        this.createdAt = createdAt;
    }

    public void markSucceeded(Long processedByUserId, String pgCancelKey, String responseMessage, Instant completedAt) {
        this.status = RefundStatus.SUCCEEDED;
        this.processedByUserId = processedByUserId;
        this.pgCancelKey = required(pgCancelKey);
        this.pgResponseMessage = responseMessage == null || responseMessage.isBlank() ? null : responseMessage.trim();
        this.completedAt = completedAt;
    }

    private String required(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("필수값이 비어 있습니다.");
        return value.trim();
    }
}
