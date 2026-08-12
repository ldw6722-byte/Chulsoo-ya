package com.chulsooya.server.domain.store;

import java.time.Instant;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 판매자 매장. 가용량 불변식(README.ko.md 6.2):
 * available = configured - reserved - active, 모든 값 >= 0, configured <= tierSlotCap
 */
@Entity
@Getter
@Table(name = "stores")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", unique = true)
	private User owner;

	@Column(nullable = false, length = 100)
	private String name;

	/** 카카오 로컬 API로 정규화한 행정구역 코드. 매칭 자격의 기준. */
	@Column(nullable = false, length = 20)
	private String guCode;

	@Column(length = 300)
	private String address;

	private String phone;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private SubscriptionTier tier = SubscriptionTier.FREE;

	@Column(nullable = false)
	private boolean verified = false;

	@Column(nullable = false)
	private boolean receivingOrders = true;

	@Column(nullable = false)
	private int configuredSlots = 3;

	@Column(nullable = false)
	private int reservedSlots = 0;

	@Column(nullable = false)
	private int activeSlots = 0;

	/** 패널티 만료 시각. 이 시점까지 응찰 차단. */
	private Instant restrictedUntil;

	@Column(nullable = false)
	private double trustScore = 60.0;

	@Version
	private Long version;

	public Store(User owner, String name, String guCode, String address, String phone, SubscriptionTier tier) {
		this.owner = owner;
		this.name = name;
		this.guCode = guCode;
		this.address = address;
		this.phone = phone;
		this.tier = tier;
		this.configuredSlots = Math.min(3, tier.getSlotCap());
	}

	public int getTierSlotCap() {
		return tier.getSlotCap();
	}

	public int getAvailableSlots() {
		return Math.max(0, configuredSlots - reservedSlots - activeSlots);
	}

	public boolean isRestricted(Instant now) {
		return restrictedUntil != null && restrictedUntil.isAfter(now);
	}

	public boolean canReceiveOffer(Instant now) {
		return verified && receivingOrders && !isRestricted(now) && getAvailableSlots() > 0;
	}

	/** 판매자 자율 설정. 등급 상한을 넘길 수 없다. */
	public void changeConfiguredSlots(int next) {
		if (next < 0 || next > getTierSlotCap()) {
			throw new DomainException(ErrorCode.SLOT_CAP_EXCEEDED,
					"설정 가능한 슬롯 범위는 0 ~ %d 입니다.".formatted(getTierSlotCap()));
		}
		this.configuredSlots = next;
	}

	/** 원터치 바쁨 모드: 설정 슬롯을 즉시 0으로 만든다. */
	public void enterBusyMode() {
		this.configuredSlots = 0;
		this.receivingOrders = false;
	}

	public void resumeReceiving(int configured) {
		changeConfiguredSlots(configured);
		this.receivingOrders = true;
	}

	/** 주문 제안 발송: reserved +1 */
	public void reserveSlot() {
		if (getAvailableSlots() <= 0) {
			throw new DomainException(ErrorCode.SLOT_FULL);
		}
		this.reservedSlots++;
	}

	/** 제안 거절/만료: reserved -1 */
	public void releaseReservedSlot() {
		this.reservedSlots = Math.max(0, this.reservedSlots - 1);
	}

	/** 낙찰: reserved -1, active +1 (원자적 전환) */
	public void convertReservedToActive() {
		this.reservedSlots = Math.max(0, this.reservedSlots - 1);
		this.activeSlots++;
	}

	/** 완료/취소/이행 불가: active -1 (정확히 한 번) */
	public void releaseActiveSlot() {
		this.activeSlots = Math.max(0, this.activeSlots - 1);
	}

	public void restrictUntil(Instant until) {
		this.restrictedUntil = until;
	}

	public void verify() {
		this.verified = true;
	}

	public void changeTier(SubscriptionTier next) {
		this.tier = next;
		if (this.configuredSlots > next.getSlotCap()) {
			this.configuredSlots = next.getSlotCap();
		}
	}

	public void adjustTrustScore(double delta) {
		this.trustScore = Math.max(0, Math.min(100, this.trustScore + delta));
	}
}
