package com.chulsooya.server.domain.coupon;

import java.time.Instant;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "coupon_issues")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CouponIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Column(nullable = false)
    private Long consumerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CouponIssueStatus status = CouponIssueStatus.AVAILABLE;

    @Column(unique = true)
    private Long appliedOrderId;

    @Column(nullable = false)
    private Instant issuedAt;

    private Instant appliedAt;
    private Instant restoredAt;

    @Column(nullable = false)
    private Instant expiresAt;

    public CouponIssue(Coupon coupon, Long consumerId, Instant issuedAt, Instant expiresAt) {
        if (coupon == null || consumerId == null || issuedAt == null || expiresAt == null || !expiresAt.isAfter(issuedAt)) {
            throw new IllegalArgumentException("쿠폰 발행 정보가 올바르지 않습니다.");
        }
        this.coupon = coupon;
        this.consumerId = consumerId;
        this.issuedAt = issuedAt;
        this.expiresAt = expiresAt;
    }

    public void apply(Long orderId, int itemsAmount, Instant now) {
        expireIfNeeded(now);
        if (status != CouponIssueStatus.AVAILABLE || !coupon.isUsableAt(now)) {
            throw new DomainException(ErrorCode.INVALID_ORDER_STATUS, "사용할 수 없는 쿠폰입니다.");
        }
        if (itemsAmount < coupon.getMinimumOrderAmount()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "쿠폰 최소 주문금액을 충족하지 않았습니다.");
        }
        this.status = CouponIssueStatus.APPLIED;
        this.appliedOrderId = orderId;
        this.appliedAt = now;
    }

    public void restoreAfterCancellation(Instant now) {
        if (status != CouponIssueStatus.APPLIED) return;
        if (!now.isBefore(expiresAt) || !coupon.isUsableAt(now)) {
            this.status = CouponIssueStatus.EXPIRED;
            return;
        }
        this.status = CouponIssueStatus.AVAILABLE;
        this.appliedOrderId = null;
        this.restoredAt = now;
    }

    public void expireIfNeeded(Instant now) {
        if (status == CouponIssueStatus.AVAILABLE && !now.isBefore(expiresAt)) this.status = CouponIssueStatus.EXPIRED;
    }
}
