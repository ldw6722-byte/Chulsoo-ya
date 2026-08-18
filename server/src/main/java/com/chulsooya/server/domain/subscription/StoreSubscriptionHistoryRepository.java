package com.chulsooya.server.domain.subscription;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSubscriptionHistoryRepository extends JpaRepository<StoreSubscriptionHistory, Long> {
    List<StoreSubscriptionHistory> findTop100ByStoreIdOrderByCreatedAtDesc(Long storeId);
    long countByProductId(Long productId);
}

