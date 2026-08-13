package com.chulsooya.server.domain.matching;

import java.time.Duration;
import java.time.Instant;

import com.chulsooya.server.domain.store.SubscriptionTier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 시간 제한 주문 제안. 발송 시 판매자 reserved_slots +1, 종료 시 -1.
 * 같은 주문 시도에서 동일 매장에 중복 발송하지 않는다.
 */
@Entity
@Getter
@Table(name = "match_offers", uniqueConstraints = @UniqueConstraint(columnNames = { "order_id", "store_id", "attempt" }))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchOffer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "order_id", nullable = false)
	private Long orderId;

	@Column(name = "store_id", nullable = false)
	private Long storeId;

	/** 재입찰 회차. Order.retryCount 와 동일한 값을 사용한다. */
	@Column(nullable = false)
	private int attempt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private SubscriptionTier tier;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private OfferStatus status = OfferStatus.SENT;

	@Column(nullable = false)
	private Instant offeredAt;

	@Column(nullable = false)
	private Instant expiresAt;

	private Instant closedAt;

	public MatchOffer(Long orderId, Long storeId, int attempt, SubscriptionTier tier,
			Instant offeredAt, int ttlSeconds) {
		this.orderId = orderId;
		this.storeId = storeId;
		this.attempt = attempt;
		this.tier = tier;
		this.offeredAt = offeredAt;
		this.expiresAt = offeredAt.plus(Duration.ofSeconds(ttlSeconds));
	}

	public boolean isOpen(Instant now) {
		return status == OfferStatus.SENT && now.isBefore(expiresAt);
	}

	/** 시차 발송 정책은 UI가 아닌 서버가 강제한다. */
	public boolean isReadyForBid(Instant now) {
		return isOpen(now) && !now.isBefore(offeredAt);
	}

	public boolean isExpired(Instant now) {
		return status == OfferStatus.SENT && !now.isBefore(expiresAt);
	}

	public void close(OfferStatus next, Instant now) {
		this.status = next;
		this.closedAt = now;
	}
}
