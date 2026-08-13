package com.chulsooya.server.domain.penalty;

import java.time.Duration;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "penalties")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Penalty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long storeId;

    @Column(nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PenaltyViolationType violationType;

    @Column(nullable = false)
    private int level;

    @Column(nullable = false)
    private double trustScoreDelta;

    private Instant restrictionUntil;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false)
    private Instant appliedAt;

    private Penalty(Long storeId, Long orderId, PenaltyViolationType violationType, int level,
            double trustScoreDelta, Instant restrictionUntil, String reason, Instant appliedAt) {
        this.storeId = storeId;
        this.orderId = orderId;
        this.violationType = violationType;
        this.level = level;
        this.trustScoreDelta = trustScoreDelta;
        this.restrictionUntil = restrictionUntil;
        this.reason = reason;
        this.appliedAt = appliedAt;
    }

    public static Penalty sellerConfirmationTimeout(Long storeId, Long orderId, Instant appliedAt) {
        return new Penalty(storeId, orderId, PenaltyViolationType.SELLER_CONFIRMATION_TIMEOUT, 3, -10.0,
                appliedAt.plus(Duration.ofHours(24)), "낙찰 후 물품 확인 시간이 만료되었습니다.", appliedAt);
    }
}
