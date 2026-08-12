package com.chulsooya.server.domain.order;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class OrderDtos {

	private OrderDtos() {
	}

	public record CreateOrderRequest(
			@NotNull FulfillmentMethod fulfillmentMethod,
			@NotBlank String address,
			String addressDetail,
			@NotBlank String guCode,
			String requestMemo,
			Integer discountAmount) {
	}

	public record OrderItemResponse(
			Long id,
			Long productId,
			String productName,
			String specSummary,
			String unit,
			int quantity,
			int priceAtOrder,
			int lineAmount) {

		public static OrderItemResponse from(OrderItem i) {
			return new OrderItemResponse(i.getId(), i.getProductId(), i.getProductName(),
					i.getSpecSummary(), i.getUnit(), i.getQuantity(), i.getPriceAtOrder(), i.getLineAmount());
		}
	}

	/**
	 * serverTime 과 마감 시각을 함께 반환한다.
	 * 클라이언트는 (deadline - serverTime) 으로 카운트다운을 계산하며 기기 시간을 신뢰하지 않는다.
	 */
	public record OrderResponse(
			Long id,
			OrderStatus status,
			FulfillmentMethod fulfillmentMethod,
			String guCode,
			String address,
			String addressDetail,
			String requestMemo,
			int itemsAmount,
			int deliveryFee,
			int discountAmount,
			int totalAmount,
			Long winningStoreId,
			String winningStoreName,
			Instant matchDeadlineAt,
			Instant sellerConfirmationDeadlineAt,
			Instant matchedAt,
			Instant sellerConfirmedAt,
			Instant paidAt,
			Instant completedAt,
			int retryCount,
			Instant createdAt,
			Instant serverTime,
			List<OrderItemResponse> items) {
	}

	public record OrderSummaryResponse(
			Long id,
			OrderStatus status,
			int totalAmount,
			int itemCount,
			String representativeProductName,
			Instant createdAt) {
	}
}
