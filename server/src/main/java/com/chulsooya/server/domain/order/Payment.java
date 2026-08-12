package com.chulsooya.server.domain.order;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 결제. idempotencyKey 유니크로 PG 재시도가 두 번째 결제를 만들지 못하게 한다.
 * ponytail: PG 연동은 스텁. upgrade path: 토스페이먼츠 어댑터 + 서명 검증 웹훅.
 */
@Entity
@Getter
@Table(name = "payments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

	public enum Status {
		READY, PAID, CANCEL_PENDING, CANCELLED, REFUNDING, PARTIAL_REFUNDED, REFUNDED
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long orderId;

	@Column(nullable = false, unique = true, length = 100)
	private String idempotencyKey;

	@Column(nullable = false)
	private int amount;

	@Column(nullable = false)
	private int remainingAmount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Status status = Status.READY;

	@Column(length = 100)
	private String pgTransactionKey;

	@Column(length = 30)
	private String method;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	private Instant paidAt;

	public Payment(Long orderId, String idempotencyKey, int amount, String method) {
		this.orderId = orderId;
		this.idempotencyKey = idempotencyKey;
		this.amount = amount;
		this.remainingAmount = amount;
		this.method = method;
	}

	public void markPaid(String pgTransactionKey, Instant now) {
		this.status = Status.PAID;
		this.pgTransactionKey = pgTransactionKey;
		this.paidAt = now;
	}
}
