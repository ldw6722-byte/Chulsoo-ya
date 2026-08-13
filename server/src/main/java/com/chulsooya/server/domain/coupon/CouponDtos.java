package com.chulsooya.server.domain.coupon;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class CouponDtos {
    private CouponDtos() {}

    public record CreateCouponRequest(@NotBlank String code, @NotBlank String title, @Min(1) int discountAmount,
            @Min(0) int minimumOrderAmount, @NotNull Instant startsAt, @NotNull @Future Instant expiresAt) {}

    public record IssueCouponRequest(@NotNull Long consumerId) {}

    public record CouponIssueResponse(Long issueId, Long couponId, String code, String title, int discountAmount,
            int minimumOrderAmount, CouponIssueStatus status, Instant issuedAt, Instant expiresAt,
            Long appliedOrderId) {
        static CouponIssueResponse from(CouponIssue issue) {
            Coupon coupon = issue.getCoupon();
            return new CouponIssueResponse(issue.getId(), coupon.getId(), coupon.getCode(), coupon.getTitle(),
                    coupon.getDiscountAmount(), coupon.getMinimumOrderAmount(), issue.getStatus(), issue.getIssuedAt(),
                    issue.getExpiresAt(), issue.getAppliedOrderId());
        }
    }

    public record CouponPolicyResponse(Long id, String code, String title, int discountAmount, int minimumOrderAmount,
            Instant startsAt, Instant expiresAt, boolean active, Instant createdAt) {
        static CouponPolicyResponse from(Coupon coupon) {
            return new CouponPolicyResponse(coupon.getId(), coupon.getCode(), coupon.getTitle(), coupon.getDiscountAmount(),
                    coupon.getMinimumOrderAmount(), coupon.getStartsAt(), coupon.getExpiresAt(), coupon.isActive(),
                    coupon.getCreatedAt());
        }
    }

    public record CouponCenterResponse(List<CouponIssueResponse> issues) {}
}
