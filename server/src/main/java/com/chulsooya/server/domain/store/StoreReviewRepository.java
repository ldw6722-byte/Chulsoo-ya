package com.chulsooya.server.domain.store;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreReviewRepository extends JpaRepository<StoreReview, Long> {
    boolean existsByOrderId(Long orderId);
    Optional<StoreReview> findByOrderId(Long orderId);
    List<StoreReview> findByStoreIdAndVisibilityOrderByCreatedAtDesc(Long storeId, StoreReview.ReviewVisibility visibility);
    List<StoreReview> findAllByOrderByCreatedAtDesc();
}
