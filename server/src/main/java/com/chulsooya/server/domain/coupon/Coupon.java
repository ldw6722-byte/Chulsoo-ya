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
@Table(name = "coupons")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false)
    private int discountAmount;

    @Column(nullable = false)
    private int minimumOrderAmount;

    @Column(nullable = false)
    private Instant startsAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean active = true;

    private Long createdBy;

    @Column(nullable = false)
    private Instant createdAt;

    public Coupon(String code, String title, int discountAmount, int minimumOrderAmount, Instant startsAt,
            Instant expiresAt, Long createdBy, Instant createdAt) {
        this.code = required(code, 40).toUpperCase();
        this.title = required(title, 100);
        if (discountAmount <= 0 || minimumOrderAmount < 0 || startsAt == null || expiresAt == null || !expiresAt.isAfter(startsAt)) {
            throw new IllegalArgumentException("쿠폰 정책 값이 올바르지 않습니다.");
        }
        this.discountAmount = discountAmount;
        this.minimumOrderAmount = minimumOrderAmount;
        this.startsAt = startsAt;
        this.expiresAt = expiresAt;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public boolean isUsableAt(Instant now) {
        return active && !now.isBefore(startsAt) && now.isBefore(expiresAt);
    }

    public void deactivate() { this.active = false; }

    private String required(String value, int max) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("쿠폰 값이 비어 있습니다.");
        String normalized = value.trim();
        if (normalized.length() > max) throw new IllegalArgumentException("쿠폰 값 길이가 제한을 초과했습니다.");
        return normalized;
    }
}
