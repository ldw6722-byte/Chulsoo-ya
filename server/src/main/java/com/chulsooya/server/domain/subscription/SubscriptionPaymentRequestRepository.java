package com.chulsooya.server.domain.subscription;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface SubscriptionPaymentRequestRepository extends JpaRepository<SubscriptionPaymentRequest, Long> {
    boolean existsByStoreIdAndStatus(Long storeId, SubscriptionPaymentRequestStatus status);

    Optional<SubscriptionPaymentRequest> findFirstByStoreIdAndStatusOrderByRequestedAtDesc(Long storeId,
            SubscriptionPaymentRequestStatus status);

    List<SubscriptionPaymentRequest> findByStatusOrderByRequestedAtAsc(SubscriptionPaymentRequestStatus status);

    /** 승인 또는 반려가 끝난 요청만 관리자 처리 이력으로 조회한다. */
    List<SubscriptionPaymentRequest> findTop100ByStatusNotOrderByReviewedAtDesc(SubscriptionPaymentRequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from SubscriptionPaymentRequest request where request.id = :id")
    Optional<SubscriptionPaymentRequest> findByIdForUpdate(@Param("id") Long id);
}
