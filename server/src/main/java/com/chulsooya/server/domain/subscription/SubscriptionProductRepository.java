package com.chulsooya.server.domain.subscription;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionProductRepository extends JpaRepository<SubscriptionProduct, Long> {
    List<SubscriptionProduct> findAllByOrderByDisplayOrderAscIdAsc();
    List<SubscriptionProduct> findByActiveTrueOrderByDisplayOrderAscIdAsc();
}

