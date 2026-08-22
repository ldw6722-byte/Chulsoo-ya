package com.chulsooya.server.domain.subscription;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.chulsooya.server.domain.store.SubscriptionTier;

public final class SubscriptionDtos {
    private SubscriptionDtos() {}

    public record ProductResponse(Long id, String name, SubscriptionTier tier, int price, int durationMonths,
            String description, boolean active, int displayOrder) {
        public static ProductResponse from(SubscriptionProduct value) {
            return new ProductResponse(value.getId(), value.getName(), value.getTier(), value.getPrice(),
                    value.getDurationMonths(), value.getDescription(), value.isActive(), value.getDisplayOrder());
        }
    }

    public record ProductRequest(@NotBlank String name, @NotNull SubscriptionTier tier, @Min(0) int price,
            @Min(1) int durationMonths, String description, boolean active, int displayOrder) {}

    public record PurchaseRequest(@NotNull Long productId) {}

    public record HistoryResponse(Long id, Long productId, SubscriptionTier previousTier, SubscriptionTier nextTier,
            Instant previousExpiresAt, Instant expiresAt, SubscriptionHistoryEvent eventType, Long changedByUserId,
            String reason, Instant createdAt) {
        public static HistoryResponse from(StoreSubscriptionHistory value) {
            return new HistoryResponse(value.getId(), value.getProductId(), value.getPreviousTier(), value.getNextTier(),
                    value.getPreviousExpiresAt(), value.getExpiresAt(), value.getEventType(), value.getChangedByUserId(),
                    value.getReason(), value.getCreatedAt());
        }
    }

    /** 서버의 매칭 정책을 표시용으로만 전달한다. 판매자 화면은 이 값을 계산하거나 보정하지 않는다. */
    public record TierPolicyResponse(SubscriptionTier tier, int slotCap, int dispatchDelaySeconds) {
        public static TierPolicyResponse from(SubscriptionTier tier) {
            return new TierPolicyResponse(tier, tier.getSlotCap(), tier.getDispatchDelaySeconds());
        }
    }

    public record PaymentRequestResponse(Long id, Long storeId, String storeName, Long productId, String productName,
            SubscriptionTier tier, int amount, int durationMonths, SubscriptionPaymentRequestStatus status,
            Instant requestedAt, Instant reviewedAt, Long reviewedByUserId, String rejectionReason) {}

    public record StatusResponse(Long storeId, String storeName, SubscriptionTier tier, Instant subscriptionExpiresAt,
            boolean activePaidMembership, List<TierPolicyResponse> tierPolicies, PaymentRequestResponse pendingPaymentRequest,
            List<HistoryResponse> history) {}

    public record AdminMembershipResponse(Long storeId, String storeName, String ownerEmail, String districtName,
            String handledItems, SubscriptionTier tier, Instant subscriptionExpiresAt, boolean activePaidMembership,
            int configuredSlots, int tierSlotCap) {}

    public record AdminChangeRequest(@NotNull SubscriptionTier tier, Instant expiresAt, String reason) {}
    public record RejectPaymentRequest(@NotBlank String reason) {}
}
