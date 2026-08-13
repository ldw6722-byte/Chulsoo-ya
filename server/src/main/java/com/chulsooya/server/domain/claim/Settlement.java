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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long orderId;

    @Column(nullable = false)
    private Long storeId;

    private Long paymentId;

    @Column(nullable = false)
    private int grossAmount;

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
        this.orderId = orderId;
        this.storeId = storeId;
        this.paymentId = paymentId;
        this.grossAmount = grossAmount;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void hold(String reason, Instant now) {
        if (status == SettlementStatus.SETTLED) throw new IllegalStateException("완료된 정산은 보류할 수 없습니다.");
        this.status = SettlementStatus.HOLD;
        this.holdReason = required(reason);
        this.heldAt = now;
        this.updatedAt = now;
    }

	public void markReleasable(Instant now) {
		if (status != SettlementStatus.HOLD) throw new IllegalStateException("보류 중인 정산만 해제할 수 있습니다.");
		this.status = SettlementStatus.RELEASABLE;
		this.releasedAt = now;
		this.updatedAt = now;
	}

	public void cancelForFullRefund(Instant now) {
		if (status != SettlementStatus.HOLD) throw new IllegalStateException("보류 중인 정산만 취소할 수 있습니다.");
		this.status = SettlementStatus.CANCELLED;
		this.updatedAt = now;
	}

    private String required(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("보류 사유가 필요합니다.");
        return value.trim();
    }
}
