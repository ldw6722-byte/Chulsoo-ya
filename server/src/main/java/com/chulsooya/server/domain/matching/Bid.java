package com.chulsooya.server.domain.matching;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 판매자 응찰. 주문당 낙찰자는 한 명(winner=true 부분 유니크 인덱스는 마이그레이션에서 정의).
 * H2 는 부분 인덱스를 지원하지 않으므로 낙찰 보장은 주문 행 비관적 락으로 수행한다.
 */
@Entity
@Getter
@Table(name = "bids", indexes = @Index(name = "ix_bids_order", columnList = "order_id"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Bid {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "order_id", nullable = false)
	private Long orderId;

	@Column(name = "store_id", nullable = false)
	private Long storeId;

	@Column(nullable = false)
	private boolean winner;

	@Column(nullable = false)
	private Instant createdAt;

	private Instant confirmedAt;

	public Bid(Long orderId, Long storeId, boolean winner, Instant createdAt) {
		this.orderId = orderId;
		this.storeId = storeId;
		this.winner = winner;
		this.createdAt = createdAt;
	}

	public void markConfirmed(Instant now) {
		this.confirmedAt = now;
	}

	public void revokeWinner() {
		this.winner = false;
	}
}
