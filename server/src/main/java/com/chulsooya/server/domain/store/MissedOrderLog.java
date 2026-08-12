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

/** 슬롯 포화 등으로 기회를 상실한 기록. reason 예: SLOT_FULL, NOT_RECEIVING, RESTRICTED */
@Entity
@Getter
@Table(name = "missed_orders_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MissedOrderLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long storeId;

	@Column(nullable = false)
	private Long orderId;

	@Column(nullable = false, length = 30)
	private String reason;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	public MissedOrderLog(Long storeId, Long orderId, String reason) {
		this.storeId = storeId;
		this.orderId = orderId;
		this.reason = reason;
	}
}
