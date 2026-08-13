package com.chulsooya.server.domain.coupon;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import com.chulsooya.server.domain.coupon.CouponDtos.CouponIssueResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.order.Order;

@Service
@Transactional(readOnly = true)
public class CouponService {

    private final CouponIssueRepository issues;
    private final CouponEventRepository events;
    private final Clock clock;

    public CouponService(CouponIssueRepository issues, CouponEventRepository events, Clock clock) {
        this.issues = issues;
        this.events = events;
        this.clock = clock;
    }

    @Transactional
    public void applyToOrder(Long consumerId, Long issueId, Order order) {
        CouponIssue issue = issues.findByIdForUpdate(issueId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "쿠폰을 찾을 수 없습니다."));
        if (!issue.getConsumerId().equals(consumerId)) throw new DomainException(ErrorCode.FORBIDDEN);
        Instant now = clock.instant();
        issue.apply(order.getId(), order.getItemsAmount(), now);
        order.applyCoupon(issueId, issue.getCoupon().getDiscountAmount());
        events.save(new CouponEvent(issueId, "APPLIED", consumerId, "주문에 쿠폰이 적용되었습니다.", now));
    }

    @Transactional
    public List<CouponIssueResponse> listMine(Long consumerId) {
        Instant now = clock.instant();
        return issues.findByConsumerIdOrderByIssuedAtDesc(consumerId).stream().map(issue -> {
            issue.expireIfNeeded(now);
            return CouponIssueResponse.from(issue);
        }).toList();
    }

    @Transactional
    public void restoreAfterOrderCancellation(Order order, Long actorUserId) {
        if (order.getCouponIssueId() == null) return;
        CouponIssue issue = issues.findByIdForUpdate(order.getCouponIssueId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "쿠폰을 찾을 수 없습니다."));
        if (issue.getStatus() != CouponIssueStatus.APPLIED) return;
        Instant now = clock.instant();
        issue.restoreAfterCancellation(now);
        events.save(new CouponEvent(issue.getId(), issue.getStatus() == CouponIssueStatus.AVAILABLE ? "RESTORED" : "EXPIRED",
                actorUserId, "주문 취소에 따라 쿠폰 상태가 갱신되었습니다.", now));
    }
}
