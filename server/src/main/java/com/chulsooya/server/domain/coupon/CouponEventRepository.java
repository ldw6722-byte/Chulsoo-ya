package com.chulsooya.server.domain.coupon;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponEventRepository extends JpaRepository<CouponEvent, Long> {
    List<CouponEvent> findByCouponIssueIdOrderByCreatedAtAsc(Long couponIssueId);
}
