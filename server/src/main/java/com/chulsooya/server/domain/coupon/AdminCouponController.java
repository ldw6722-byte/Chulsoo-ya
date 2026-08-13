package com.chulsooya.server.domain.coupon;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.coupon.CouponDtos.CreateCouponRequest;
import com.chulsooya.server.domain.coupon.CouponDtos.CouponIssueResponse;
import com.chulsooya.server.domain.coupon.CouponDtos.CouponPolicyResponse;
import com.chulsooya.server.domain.coupon.CouponDtos.IssueCouponRequest;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/coupons")
public class AdminCouponController {

    private final CouponAdminService couponAdminService;

    public AdminCouponController(CouponAdminService couponAdminService) {
        this.couponAdminService = couponAdminService;
    }

    @GetMapping
    public ApiResponse<List<CouponPolicyResponse>> list(CurrentUser user) {
        requireAdmin(user);
        return ApiResponse.of(couponAdminService.listPolicies());
    }

    @PostMapping
    public ApiResponse<CouponPolicyResponse> create(CurrentUser user, @Valid @RequestBody CreateCouponRequest request) {
        requireAdmin(user);
        return ApiResponse.of(couponAdminService.create(user.userId(), request));
    }

    @PostMapping("/{couponId}/issues")
    public ApiResponse<CouponIssueResponse> issue(CurrentUser user, @PathVariable Long couponId,
            @Valid @RequestBody IssueCouponRequest request) {
        requireAdmin(user);
        return ApiResponse.of(couponAdminService.issue(user.userId(), couponId, request.consumerId()));
    }

    private void requireAdmin(CurrentUser user) {
        if (!user.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }
}
