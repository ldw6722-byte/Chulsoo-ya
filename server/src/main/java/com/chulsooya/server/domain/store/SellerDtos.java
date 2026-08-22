package com.chulsooya.server.domain.store;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import com.chulsooya.server.domain.order.FulfillmentMethod;
import com.chulsooya.server.domain.order.OrderStatus;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public final class SellerDtos {

	private SellerDtos() {
	}

	public record StoreResponse(
			Long id,
			String name,
			String guCode,
			String address,
			String phone,
			SubscriptionTier tier,
			int tierSlotCap,
			int configuredSlots,
			int reservedSlots,
			int activeSlots,
			int availableSlots,
			boolean receivingOrders,
			boolean verified,
							Instant restrictedUntil,
				double trustScore,
				Instant serverTime,
                String directions,
                LocalTime businessOpenTime,
                LocalTime businessCloseTime,
                Set<DayOfWeek> weeklyClosedDays,
                boolean temporaryClosed,
                StoreOperatingStatus operatingStatus) {

	}

	public record UpdateSlotsRequest(@NotNull @Min(0) Integer configuredSlots, String reason) {
	}

    public record UpdateStoreOperationsRequest(String directions, @NotNull LocalTime businessOpenTime,
            @NotNull LocalTime businessCloseTime, Set<DayOfWeek> weeklyClosedDays, boolean temporaryClosed) {
    }

	public record OfferItemLine(String productName, String specSummary, int quantity, String unit) {
	}

	/** 판매자 제안 큐 항목. expiresAt/serverTime 으로 만료 카운트다운을 계산한다. */
	public record OfferResponse(
			Long offerId,
			Long orderId,
			OrderStatus orderStatus,
			FulfillmentMethod fulfillmentMethod,
			String guCode,
			String addressMasked,
			int itemsAmount,
			int deliveryFee,
			int totalAmount,
			int itemCount,
			List<OfferItemLine> lines,
			Instant offeredAt,
			Instant expiresAt,
			Instant serverTime) {
	}

	/** 낙찰 후 이행 작업 영역 항목. */
	public record AssignedOrderResponse(
			Long orderId,
			OrderStatus status,
			FulfillmentMethod fulfillmentMethod,
			String addressMasked,
			int totalAmount,
			int itemCount,
			List<OfferItemLine> lines,
			Instant sellerConfirmationDeadlineAt,
			Instant matchedAt,
			Instant serverTime) {
	}

		/** 판매자 문서함용 완료 거래 목록. 개인정보를 포함하지 않는다. */
	public record CompletedTradeDocumentResponse(
			Long orderId,
			FulfillmentMethod fulfillmentMethod,
			int totalAmount,
			int itemCount,
			Instant completedAt) {
	}

	public record MetricsResponse(

			long receivedOffers,
			long wonBids,
			long missedOrders,
			double matchSuccessRate,
			double trustScore) {
	}

	public record SlotLogResponse(
			Long id,
			int oldConfiguredSlots,
			int newConfiguredSlots,
			String changedBy,
			String reason,
			Instant createdAt) {
	}

	/** 판매자 본인에게만 공개하는 제한·신뢰점수 패널티 감사 이력. */
	public record PenaltyHistoryResponse(
			Long id,
			Long orderId,
			String violationType,
			int level,
			double trustScoreDelta,
			Instant restrictionUntil,
			String reason,
			Instant appliedAt) {
	}
}
