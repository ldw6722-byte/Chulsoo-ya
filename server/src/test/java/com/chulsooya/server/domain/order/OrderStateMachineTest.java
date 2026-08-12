package com.chulsooya.server.domain.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.chulsooya.server.common.DomainException;

class OrderStateMachineTest {

	private static final int MATCH_WINDOW = 300;
	private static final int CONFIRM_WINDOW = 120;

	private Order newOrder() {
		Order order = new Order(1L, "GU_TEST", FulfillmentMethod.DELIVERY,
				"서울특별시 강남구 테헤란로 1", "101호", null, 3000);
		order.addItem(new OrderItem(10L, "망치", "450g", "개", 2, 12000));
		return order;
	}

	@Test
	@DisplayName("주문 요청 시 5분 매칭 마감 시각이 서버 시각 기준으로 설정된다")
	void submitSetsMatchDeadline() {
		Instant now = Instant.parse("2026-08-12T01:00:00Z");
		Order order = newOrder();

		order.submitForMatching(now, MATCH_WINDOW);

		assertThat(order.getStatus()).isEqualTo(OrderStatus.WAITING_MATCH);
		assertThat(order.getMatchDeadlineAt()).isEqualTo(now.plusSeconds(300));
	}

	@Test
	@DisplayName("낙찰 시 SELLER_CONFIRMING 으로 전이하고 2분 확인 마감이 설정된다")
	void assignWinnerSetsConfirmDeadline() {
		Instant now = Instant.parse("2026-08-12T01:00:00Z");
		Order order = newOrder();
		order.submitForMatching(now, MATCH_WINDOW);

		order.assignWinner(7L, now.plusSeconds(10), CONFIRM_WINDOW);

		assertThat(order.getStatus()).isEqualTo(OrderStatus.SELLER_CONFIRMING);
		assertThat(order.getWinningStoreId()).isEqualTo(7L);
		assertThat(order.getSellerConfirmationDeadlineAt()).isEqualTo(now.plusSeconds(130));
	}

	@Test
	@DisplayName("이미 낙찰자가 있는 주문에는 두 번째 낙찰이 생성되지 않는다")
	void secondWinnerRejected() {
		Instant now = Instant.parse("2026-08-12T01:00:00Z");
		Order order = newOrder();
		order.submitForMatching(now, MATCH_WINDOW);
		order.assignWinner(7L, now, CONFIRM_WINDOW);

		assertThatThrownBy(() -> order.assignWinner(8L, now, CONFIRM_WINDOW))
				.isInstanceOf(DomainException.class);
	}

	@Test
	@DisplayName("매칭 마감 시각이 지나면 낙찰이 거부된다")
	void assignAfterDeadlineRejected() {
		Instant now = Instant.parse("2026-08-12T01:00:00Z");
		Order order = newOrder();
		order.submitForMatching(now, MATCH_WINDOW);

		assertThatThrownBy(() -> order.assignWinner(7L, now.plusSeconds(301), CONFIRM_WINDOW))
				.isInstanceOf(DomainException.class);
	}

	@Test
	@DisplayName("2분 확인 마감이 지나면 물품 확인이 거부된다")
	void confirmAfterDeadlineRejected() {
		Instant now = Instant.parse("2026-08-12T01:00:00Z");
		Order order = newOrder();
		order.submitForMatching(now, MATCH_WINDOW);
		order.assignWinner(7L, now, CONFIRM_WINDOW);

		assertThatThrownBy(() -> order.confirmStock(now.plusSeconds(121)))
				.isInstanceOf(DomainException.class);
	}

	@Test
	@DisplayName("판매자 물품 확인 전에는 결제를 완료할 수 없다")
	void paymentBeforeConfirmRejected() {
		Instant now = Instant.parse("2026-08-12T01:00:00Z");
		Order order = newOrder();
		order.submitForMatching(now, MATCH_WINDOW);
		order.assignWinner(7L, now, CONFIRM_WINDOW);

		assertThatThrownBy(() -> order.markPaid(now.plusSeconds(1)))
				.isInstanceOf(DomainException.class);
	}

	@Test
	@DisplayName("정상 순서: 확인 완료 -> PAYMENT_PENDING -> PAID")
	void happyPathToPaid() {
		Instant now = Instant.parse("2026-08-12T01:00:00Z");
		Order order = newOrder();
		order.submitForMatching(now, MATCH_WINDOW);
		order.assignWinner(7L, now, CONFIRM_WINDOW);

		order.confirmStock(now.plusSeconds(30));
		assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);

		order.markPaid(now.plusSeconds(60));
		assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
	}

	@Test
	@DisplayName("재입찰 시 낙찰자가 비워지고 retryCount 가 증가한다")
	void restartMatchingClearsWinner() {
		Instant now = Instant.parse("2026-08-12T01:00:00Z");
		Order order = newOrder();
		order.submitForMatching(now, MATCH_WINDOW);
		order.assignWinner(7L, now, CONFIRM_WINDOW);

		order.restartMatching(now.plusSeconds(121), MATCH_WINDOW);

		assertThat(order.getStatus()).isEqualTo(OrderStatus.WAITING_MATCH);
		assertThat(order.getWinningStoreId()).isNull();
		assertThat(order.getRetryCount()).isEqualTo(1);
	}

	@Test
	@DisplayName("합계 금액 = 품목 금액 + 배달비 - 할인")
	void totalAmountCalculation() {
		Order order = newOrder();
		order.applyDiscount(2000);

		assertThat(order.getItemsAmount()).isEqualTo(24000);
		assertThat(order.getDeliveryFee()).isEqualTo(3000);
		assertThat(order.getTotalAmount()).isEqualTo(25000);
	}

	@Test
	@DisplayName("픽업 주문에는 배달비가 부과되지 않는다")
	void pickupHasNoDeliveryFee() {
		Order order = new Order(1L, "GU_TEST", FulfillmentMethod.PICKUP, null, null, null, 3000);
		order.addItem(new OrderItem(10L, "망치", "450g", "개", 1, 12000));

		assertThat(order.getDeliveryFee()).isZero();
		assertThat(order.getTotalAmount()).isEqualTo(12000);
	}
}
