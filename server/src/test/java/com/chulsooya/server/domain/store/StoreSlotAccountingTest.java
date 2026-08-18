package com.chulsooya.server.domain.store;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

class StoreSlotAccountingTest {

	private static final Instant NOW = Instant.parse("2026-08-12T01:00:00Z");

	private Store store;

	@BeforeEach
	void setUp() {
		User owner = new User("s@x.dev", "사장", "010", UserRole.SELLER);
		store = new Store(owner, "철수네", "GU_TEST", "서울 강남구 1", "02", SubscriptionTier.GOLD);
		store.verify();
		store.changeConfiguredSlots(5);
	}

	@Test
	@DisplayName("available = configured - reserved - active")
	void availableFormula() {
		store.reserveSlot();
		store.reserveSlot();
		store.convertReservedToActive();

		assertThat(store.getConfiguredSlots()).isEqualTo(5);
		assertThat(store.getReservedSlots()).isEqualTo(1);
		assertThat(store.getActiveSlots()).isEqualTo(1);
		assertThat(store.getAvailableSlots()).isEqualTo(3);
	}

	@Test
	@DisplayName("등급 상한을 초과하는 슬롯 설정은 거부된다")
	void slotCapEnforced() {
		assertThatThrownBy(() -> store.changeConfiguredSlots(9))
				.isInstanceOf(DomainException.class);
		assertThat(store.getTierSlotCap()).isEqualTo(8);
	}

	@Test
	@DisplayName("가용 슬롯이 없으면 예약이 거부된다")
	void reserveBeyondCapacityRejected() {
		store.changeConfiguredSlots(1);
		store.reserveSlot();

		assertThatThrownBy(() -> store.reserveSlot()).isInstanceOf(DomainException.class);
	}

	@Test
	@DisplayName("제안 거절/만료 시 예약 슬롯이 즉시 해제된다")
	void releaseReserved() {
		store.reserveSlot();
		store.releaseReservedSlot();

		assertThat(store.getReservedSlots()).isZero();
		assertThat(store.getAvailableSlots()).isEqualTo(5);
	}

	@Test
	@DisplayName("모든 카운터는 0 이하로 내려가지 않는다")
	void countersNeverNegative() {
		store.releaseReservedSlot();
		store.releaseActiveSlot();

		assertThat(store.getReservedSlots()).isZero();
		assertThat(store.getActiveSlots()).isZero();
	}

	@Test
	@DisplayName("바쁨 모드는 설정 슬롯을 0으로 만들고 수신을 중지한다")
	void busyModeZeroesSlots() {
		store.enterBusyMode();

		assertThat(store.getConfiguredSlots()).isZero();
		assertThat(store.isReceivingOrders()).isFalse();
		assertThat(store.canReceiveOffer(NOW)).isFalse();
	}

	@Test
	@DisplayName("패널티 기간에는 제안을 받을 수 없다")
	void restrictedStoreCannotReceive() {
		store.restrictUntil(NOW.plus(Duration.ofHours(24)));

		assertThat(store.canReceiveOffer(NOW)).isFalse();
		assertThat(store.canReceiveOffer(NOW.plus(Duration.ofHours(25)))).isTrue();
	}

	@Test
	@DisplayName("등급 하향 시 설정 슬롯이 새 상한으로 조정된다")
	void tierDowngradeClampsSlots() {
		store.changeConfiguredSlots(8);
		store.changeTier(SubscriptionTier.SILVER);

		assertThat(store.getConfiguredSlots()).isEqualTo(3);
	}

	@Test
	@DisplayName("미검증 매장은 제안 대상이 아니다")
	void unverifiedStoreExcluded() {
		User owner = new User("s2@x.dev", "사장2", "010", UserRole.SELLER);
		Store unverified = new Store(owner, "신규", "GU_TEST", "서울 강남구 2", "02", SubscriptionTier.SILVER);

		assertThat(unverified.canReceiveOffer(NOW)).isFalse();
	}
}
