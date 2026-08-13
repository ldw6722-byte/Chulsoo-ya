package com.chulsooya.server.domain.coupon;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface CouponIssueRepository extends JpaRepository<CouponIssue, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select issue from CouponIssue issue join fetch issue.coupon where issue.id = :issueId")
    Optional<CouponIssue> findByIdForUpdate(@Param("issueId") Long issueId);

    List<CouponIssue> findByConsumerIdOrderByIssuedAtDesc(Long consumerId);
}
