package com.chulsooya.server.domain.claim;

import java.time.Instant;
import java.util.Set;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

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
@Table(name = "claims")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long consumerId;

    @Column(nullable = false)
    private Long storeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ClaimType claimType;

    @Column(nullable = false, length = 50)
    private String reasonCode;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ClaimStatus status = ClaimStatus.REQUESTED;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant resolvedAt;

    @Version
    private Long version;

    public Claim(Long orderId, Long consumerId, Long storeId, ClaimType claimType, String reasonCode,
            String description, Instant now) {
        this.orderId = orderId;
        this.consumerId = consumerId;
        this.storeId = storeId;
        this.claimType = claimType;
        this.reasonCode = required(reasonCode, 50);
        this.description = required(description, 2000);
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void transitionTo(ClaimStatus next, Instant now) {
        if (!allowedNext().contains(next)) {
            throw new DomainException(ErrorCode.INVALID_ORDER_STATUS,
                    "클레임 상태 전이가 허용되지 않습니다: %s -> %s".formatted(status, next));
        }
        this.status = next;
        this.updatedAt = now;
        if (next == ClaimStatus.RESOLVED || next == ClaimStatus.REJECTED) this.resolvedAt = now;
    }

    private Set<ClaimStatus> allowedNext() {
        return switch (status) {
            case REQUESTED -> Set.of(ClaimStatus.SELLER_REVIEWING, ClaimStatus.PICKUP_SCHEDULED,
                    ClaimStatus.REPLACEMENT_SHIPPING, ClaimStatus.ESCALATED, ClaimStatus.RESOLVED,
                    ClaimStatus.REJECTED);
            case SELLER_REVIEWING -> Set.of(ClaimStatus.PICKUP_SCHEDULED, ClaimStatus.REPLACEMENT_SHIPPING,
                    ClaimStatus.ESCALATED, ClaimStatus.RESOLVED, ClaimStatus.REJECTED);
            case PICKUP_SCHEDULED, REPLACEMENT_SHIPPING -> Set.of(ClaimStatus.ESCALATED,
                    ClaimStatus.RESOLVED, ClaimStatus.REJECTED);
            case ESCALATED -> Set.of(ClaimStatus.RESOLVED, ClaimStatus.REJECTED);
            case RESOLVED, REJECTED -> Set.of();
        };
    }

    private String required(String value, int limit) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("필수값이 비어 있습니다.");
        String normalized = value.trim();
        if (normalized.length() > limit) throw new IllegalArgumentException("입력 길이가 제한을 초과했습니다.");
        return normalized;
    }
}
