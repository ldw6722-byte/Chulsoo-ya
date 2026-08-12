package com.chulsooya.server.domain.order;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 주문. 마감 시각(matchDeadlineAt, sellerConfirmationDeadlineAt)은 서버만 판정한다.
 * README.ko.md 1: 시간의 권위는 서버.
 */
@Entity
@Getter
@Table(name = "orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long consumerId;

	@Column(nullable = false, length = 20)
	private String guCode;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private OrderStatus status = OrderStatus.DRAFT;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private FulfillmentMethod fulfillmentMethod;

	@Column(length = 300)
	private String address;

	@Column(length = 100)
	private String addressDetail;

	@Column(length = 200)
	private String requestMemo;

	@Column(nullable = false)
	private int itemsAmount;

	@Column(nullable = false)
	private int deliveryFee;

	@Column(nullable = false)
	private int discountAmount;

	/** 낙찰 판매자. 낙찰 전에는 null. */
	private Long winningStoreId;

	private Instant matchDeadlineAt;
	private Instant sellerConfirmationDeadlineAt;
	private Instant matchedAt;
	private Instant sellerConfirmedAt;
	private Instant paidAt;
	private Instant deliveryStartedAt;
	private Instant completedAt;

	@Column(nullable = false)
	private int retryCount = 0;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "order_id")
	private List<OrderItem> items = new ArrayList<>();

	@Version
	private Long version;

	public Order(Long consumerId, String guCode, FulfillmentMethod method,
			String address, String addressDetail, String requestMemo, int deliveryFee) {
		this.consumerId = consumerId;
		this.guCode = guCode;
		this.fulfillmentMethod = method;
		this.address = address;
		this.addressDetail = addressDetail;
		this.requestMemo = requestMemo;
		this.deliveryFee = method == FulfillmentMethod.DELIVERY ? deliveryFee : 0;
	}

	public void addItem(OrderItem item) {
		this.items.add(item);
		this.itemsAmount += item.getLineAmount();
	}

	public int getTotalAmount() {
		return Math.max(0, itemsAmount + deliveryFee - discountAmount);
	}

	public void applyDiscount(int amount) {
		this.discountAmount = Math.max(0, Math.min(amount, itemsAmount));
	}

	/** DRAFT -> WAITING_MATCH. 5분 매칭 마감 시각을 서버 시각으로 확정한다. */
	public void submitForMatching(Instant now, int matchWindowSeconds) {
		transitionTo(OrderStatus.WAITING_MATCH, now);
		this.matchDeadlineAt = now.plus(Duration.ofSeconds(matchWindowSeconds));
	}

	/** 낙찰. 2분 물품 확인 마감 시각을 확정한다. */
	public void assignWinner(Long storeId, Instant now, int confirmWindowSeconds) {
		if (this.status != OrderStatus.WAITING_MATCH) {
			throw new DomainException(ErrorCode.ORDER_NOT_WAITING_MATCH);
		}
		if (this.winningStoreId != null) {
			throw new DomainException(ErrorCode.ALREADY_HAS_WINNER);
		}
		if (isMatchDeadlinePassed(now)) {
			throw new DomainException(ErrorCode.ORDER_NOT_WAITING_MATCH, "매칭 대기 시간이 만료되었습니다.");
		}
		this.winningStoreId = storeId;
		this.matchedAt = now;
		transitionTo(OrderStatus.MATCHED, now);
		transitionTo(OrderStatus.SELLER_CONFIRMING, now);
		this.sellerConfirmationDeadlineAt = now.plus(Duration.ofSeconds(confirmWindowSeconds));
	}

	/** 판매자 물품 확인 완료 -> 결제 가능 상태. */
	public void confirmStock(Instant now) {
		if (this.status != OrderStatus.SELLER_CONFIRMING) {
			throw new DomainException(ErrorCode.INVALID_ORDER_STATUS);
		}
		if (isConfirmationDeadlinePassed(now)) {
			throw new DomainException(ErrorCode.CONFIRMATION_DEADLINE_PASSED);
		}
		this.sellerConfirmedAt = now;
		transitionTo(OrderStatus.PAYMENT_PENDING, now);
	}

	public void markPaid(Instant now) {
		if (this.status != OrderStatus.PAYMENT_PENDING) {
			throw new DomainException(ErrorCode.PAYMENT_NOT_ALLOWED_YET);
		}
		this.paidAt = now;
		transitionTo(OrderStatus.PAID, now);
	}

	public void markMatchFailed(Instant now) {
		transitionTo(OrderStatus.MATCH_FAILED, now);
	}

	/** 이행 불가/확인 만료 시 재입찰. 낙찰자를 비우고 마감 시각을 재설정한다. */
	public void restartMatching(Instant now, int matchWindowSeconds) {
		transitionTo(OrderStatus.RE_MATCHING, now);
		this.winningStoreId = null;
		this.matchedAt = null;
		this.sellerConfirmationDeadlineAt = null;
		this.retryCount++;
		transitionTo(OrderStatus.WAITING_MATCH, now);
		this.matchDeadlineAt = now.plus(Duration.ofSeconds(matchWindowSeconds));
	}

	public void cancel(Instant now) {
		transitionTo(OrderStatus.CANCELLED, now);
	}

	public void transitionTo(OrderStatus next, Instant now) {
		if (!this.status.canTransitionTo(next)) {
			throw new DomainException(ErrorCode.INVALID_ORDER_STATUS,
					"%s -> %s 전이는 허용되지 않습니다.".formatted(this.status, next));
		}
		this.status = next;
		this.updatedAt = now;
		if (next == OrderStatus.DELIVERY_IN_PROGRESS) {
			this.deliveryStartedAt = now;
		}
		if (next == OrderStatus.COMPLETED) {
			this.completedAt = now;
		}
	}

	public boolean isMatchDeadlinePassed(Instant now) {
		return matchDeadlineAt != null && !now.isBefore(matchDeadlineAt);
	}

	public boolean isConfirmationDeadlinePassed(Instant now) {
		return sellerConfirmationDeadlineAt != null && !now.isBefore(sellerConfirmationDeadlineAt);
	}
}
