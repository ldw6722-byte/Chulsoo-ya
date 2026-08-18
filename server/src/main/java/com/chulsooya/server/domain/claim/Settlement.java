package com.chulsooya.server.domain.claim;

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

@Entity
@Getter
@Table(name = "settlements")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Settlement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private Long orderId;
    @Column(nullable = false)
    private Long storeId;
    private Long paymentId;
    @Column(nullable = false)
    private int grossAmount;
    @Column(nullable = false)
    private int commissionRateBps;
    @Column(nullable = false)
    private int commissionAmount;
    @Column(nullable = false)
    private int refundedAmount;
    @Column(nullable = false)
    private int sellerPayableAmount;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SettlementStatus status = SettlementStatus.PENDING;
    @Column(length = 500)
    private String holdReason;
    private Instant heldAt;
    private Instant releasedAt;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Version
    private Long version;

    public Settlement(Long orderId, Long storeId, Long paymentId, int grossAmount, Instant now) {
        this(orderId, storeId, paymentId, grossAmount, 0, now);
    }

    public Settlement(Long orderId, Long storeId, Long paymentId, int grossAmount, int commissionRateBps, Instant now) {
        if (grossAmount < 0 || commissionRateBps < 0 || commissionRateBps > 10_000) {
            throw new IllegalArgumentException("정산 금액 또는 수수료율이 올바르지 않습니다.");
        }
        this.orderId = orderId;
        this.storeId = storeId;
        this.paymentId = paymentId;
        this.grossAmount = grossAmount;
        this.commissionRateBps = commissionRateBps;
        this.createdAt = now;
        this.updatedAt = now;
        recalculate();
    }

    public void applyRefund(int amount, Instant now) {
        if (amount <= 0 || refundedAmount + amount > grossAmount) throw new IllegalArgumentException("정산 환불 금액이 올바르지 않습니다.");
        if (status == SettlementStatus.SETTLED) throw new IllegalStateException("완료된 정산은 환불할 수 없습니다.");
        refundedAmount += amount;
        recalculate();
        if (refundedAmount == grossAmount) status = SettlementStatus.CANCELLED;
        updatedAt = now;
    }

    public void hold(String reason, Instant now) {
        if (status == SettlementStatus.SETTLED) throw new IllegalStateException("완료된 정산은 보류할 수 없습니다.");
        status = SettlementStatus.HOLD;
        holdReason = required(reason);
        heldAt = now;
        updatedAt = now;
    }

    public void markReleasable(Instant now) {
        if (status != SettlementStatus.HOLD) throw new IllegalStateException("보류 중인 정산만 해제할 수 있습니다.");
        status = SettlementStatus.RELEASABLE;
        releasedAt = now;
        updatedAt = now;
    }

    public void cancelForFullRefund(Instant now) {
        if (status == SettlementStatus.SETTLED) throw new IllegalStateException("완료된 정산은 취소할 수 없습니다.");
        refundedAmount = grossAmount;
        recalculate();
        status = SettlementStatus.CANCELLED;
        updatedAt = now;
    }

    private void recalculate() {
        int refundableBase = grossAmount - refundedAmount;
        commissionAmount = (int) (((long) refundableBase * commissionRateBps) / 10_000L);
        sellerPayableAmount = refundableBase - commissionAmount;
    }

    private String required(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("보류 사유가 필요합니다.");
        return value.trim();
    }
}
