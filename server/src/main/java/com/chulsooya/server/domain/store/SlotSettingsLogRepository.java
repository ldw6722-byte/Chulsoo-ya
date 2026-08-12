package com.chulsooya.server.domain.store;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SlotSettingsLogRepository extends JpaRepository<StoreSlotSettingsLog, Long> {

	List<StoreSlotSettingsLog> findTop50ByStoreIdOrderByCreatedAtDesc(Long storeId);
}
