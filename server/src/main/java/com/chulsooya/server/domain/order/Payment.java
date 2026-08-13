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

	/** 결제 직후 전액 취소. 환불과 달리 승인 무효화 상태를 보존한다. */
	public void cancelFull() {
		if (status != Status.PAID || remainingAmount != amount) {
			throw new IllegalStateException("전액 취소 가능한 결제 상태가 아닙니다.");
		}
		remainingAmount = 0;
		status = Status.CANCELLED;
	}

	/** 성공한 환불만 결제 잔액에 반영한다. amount = refunded + remaining 불변식을 유지한다. */
	public void applyRefund(int refundAmount) {
		if (status != Status.PAID && status != Status.PARTIAL_REFUNDED) {
			throw new IllegalStateException("결제 완료 상태에서만 환불할 수 있습니다.");
		}
		if (refundAmount <= 0 || refundAmount > remainingAmount) {
			throw new IllegalArgumentException("환불 금액이 남은 결제 금액 범위를 벗어났습니다.");
		}
		remainingAmount -= refundAmount;
		status = remainingAmount == 0 ? Status.REFUNDED : Status.PARTIAL_REFUNDED;
	}
}
