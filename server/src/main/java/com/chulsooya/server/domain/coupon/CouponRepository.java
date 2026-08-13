package com.chulsooya.server.domain.coupon;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findAllByOrderByCreatedAtDesc();
}
