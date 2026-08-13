package com.chulsooya.server.domain.coupon;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "coupon_events")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CouponEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long couponIssueId;

    @Column(nullable = false, length = 30)
    private String eventType;

    private Long actorUserId;

    @Column(nullable = false, length = 500)
    private String detail;

    @Column(nullable = false)
    private Instant createdAt;

    public CouponEvent(Long couponIssueId, String eventType, Long actorUserId, String detail, Instant createdAt) {
        this.couponIssueId = couponIssueId;
        this.eventType = required(eventType, 30);
        this.actorUserId = actorUserId;
        this.detail = required(detail, 500);
        this.createdAt = createdAt;
    }

    private String required(String value, int max) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("쿠폰 이벤트 값이 비어 있습니다.");
        String normalized = value.trim();
        if (normalized.length() > max) throw new IllegalArgumentException("쿠폰 이벤트 길이가 제한을 초과했습니다.");
        return normalized;
    }
}
