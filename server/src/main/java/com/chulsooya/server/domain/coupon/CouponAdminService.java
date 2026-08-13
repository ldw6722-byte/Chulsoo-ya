package com.chulsooya.server.domain.coupon;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.coupon.CouponDtos.CreateCouponRequest;
import com.chulsooya.server.domain.coupon.CouponDtos.CouponPolicyResponse;
import com.chulsooya.server.domain.coupon.CouponDtos.CouponIssueResponse;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.support.CustomerNotification;
import com.chulsooya.server.domain.support.CustomerNotificationRepository;

@Service
@Transactional(readOnly = true)
public class CouponAdminService {

    private final CouponRepository coupons;
    private final CouponIssueRepository issues;
    private final CouponEventRepository events;
    private final UserRepository users;
    private final CustomerNotificationRepository notifications;
    private final Clock clock;

    public CouponAdminService(CouponRepository coupons, CouponIssueRepository issues, CouponEventRepository events,
            UserRepository users, CustomerNotificationRepository notifications, Clock clock) {
        this.coupons = coupons;
        this.issues = issues;
        this.events = events;
        this.users = users;
        this.notifications = notifications;
        this.clock = clock;
    }

    @Transactional
    public CouponPolicyResponse create(Long adminId, CreateCouponRequest request) {
        Instant now = clock.instant();
        if (!request.expiresAt().isAfter(request.startsAt())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "쿠폰 종료 시각은 시작 시각보다 뒤여야 합니다.");
        }
        Coupon coupon = coupons.save(new Coupon(request.code(), request.title(), request.discountAmount(),
                request.minimumOrderAmount(), request.startsAt(), request.expiresAt(), adminId, now));
        return CouponPolicyResponse.from(coupon);
    }

    @Transactional
    public CouponIssueResponse issue(Long adminId, Long couponId, Long consumerId) {
        Coupon coupon = coupons.findById(couponId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "쿠폰 정책을 찾을 수 없습니다."));
        if (!coupon.isUsableAt(clock.instant())) {
            throw new DomainException(ErrorCode.INVALID_ORDER_STATUS, "현재 발행할 수 없는 쿠폰입니다.");
        }
        users.findById(consumerId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원를 찾을 수 없습니다."));
        Instant now = clock.instant();
        CouponIssue issue = issues.save(new CouponIssue(coupon, consumerId, now, coupon.getExpiresAt()));
        events.save(new CouponEvent(issue.getId(), "ISSUED", adminId, "관리자가 무상 쿠폰을 발행했습니다.", now));
        notifications.save(new CustomerNotification(consumerId, "COUPON_ISSUED", "새 쿠폰이 발행되었습니다",
                coupon.getTitle() + " · " + coupon.getDiscountAmount() + "원 할인 · " + coupon.getMinimumOrderAmount()
                        + "원 이상 주문 · " + coupon.getExpiresAt() + "까지 사용 가능", "/checkout"));
        return CouponIssueResponse.from(issue);
    }

    public List<CouponPolicyResponse> listPolicies() {
        return coupons.findAllByOrderByCreatedAtDesc().stream().map(CouponPolicyResponse::from).toList();
    }
}
