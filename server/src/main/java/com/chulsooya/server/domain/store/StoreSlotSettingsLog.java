package com.chulsooya.server.domain.store;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 변경 불가능한 가용량 변경 감사 이력. README.ko.md 6.1 */
@Entity
@Getter
@Table(name = "store_slot_settings_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreSlotSettingsLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long storeId;

	@Column(nullable = false)
	private int oldConfiguredSlots;

	@Column(nullable = false)
	private int newConfiguredSlots;

	/** SELLER / ADMIN / SYSTEM */
	@Column(nullable = false, length = 20)
	private String changedBy;

	@Column(length = 200)
	private String reason;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	public StoreSlotSettingsLog(Long storeId, int oldSlots, int newSlots, String changedBy, String reason) {
		this.storeId = storeId;
		this.oldConfiguredSlots = oldSlots;
		this.newConfiguredSlots = newSlots;
		this.changedBy = changedBy;
		this.reason = reason;
	}
}
