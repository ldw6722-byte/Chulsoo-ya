package com.chulsooya.server.domain.coupon;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.coupon.CouponDtos.CouponCenterResponse;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping("/mine")
    public ApiResponse<CouponCenterResponse> mine(CurrentUser user) {
        return ApiResponse.of(new CouponCenterResponse(couponService.listMine(user.userId())));
    }
}
