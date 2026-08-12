package com.chulsooya.server.domain.store;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MissedOrderLogRepository extends JpaRepository<MissedOrderLog, Long> {

	long countByStoreId(Long storeId);

	List<MissedOrderLog> findTop50ByStoreIdOrderByCreatedAtDesc(Long storeId);
}
