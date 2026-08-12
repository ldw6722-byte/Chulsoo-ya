package com.chulsooya.server.domain.order;

import java.util.Set;

/** README.ko.md 6.3 주문 상태 머신. 전이는 여기서만 정의한다. */
public enum OrderStatus {

	DRAFT,
	WAITING_MATCH,
	MATCHED,
	SELLER_CONFIRMING,
	PAYMENT_PENDING,
	PAID,
	PREPARING,
	DELIVERY_IN_PROGRESS,
	PICKUP_READY,
	COMPLETED,
	MATCH_FAILED,
	RE_MATCHING,
	CANCELLED;

	public boolean canTransitionTo(OrderStatus next) {
		return allowedNext().contains(next);
	}

	public Set<OrderStatus> allowedNext() {
		return switch (this) {
			case DRAFT -> Set.of(WAITING_MATCH, CANCELLED);
			case WAITING_MATCH -> Set.of(MATCHED, MATCH_FAILED, CANCELLED);
			case MATCHED -> Set.of(SELLER_CONFIRMING, RE_MATCHING, CANCELLED);
			case SELLER_CONFIRMING -> Set.of(PAYMENT_PENDING, RE_MATCHING, CANCELLED);
			case PAYMENT_PENDING -> Set.of(PAID, CANCELLED);
			case PAID -> Set.of(PREPARING, CANCELLED);
			case PREPARING -> Set.of(DELIVERY_IN_PROGRESS, PICKUP_READY, CANCELLED);
			case DELIVERY_IN_PROGRESS, PICKUP_READY -> Set.of(COMPLETED, CANCELLED);
			case RE_MATCHING -> Set.of(WAITING_MATCH, MATCH_FAILED, CANCELLED);
			case MATCH_FAILED -> Set.of(WAITING_MATCH, CANCELLED);
			case COMPLETED, CANCELLED -> Set.of();
		};
	}

	public boolean isTerminal() {
		return this == COMPLETED || this == CANCELLED;
	}
}
