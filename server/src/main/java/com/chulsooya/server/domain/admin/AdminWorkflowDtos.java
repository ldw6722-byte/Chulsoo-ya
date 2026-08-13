package com.chulsooya.server.domain.admin;

import java.time.Instant;
import java.util.List;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public final class AdminWorkflowDtos {
    private AdminWorkflowDtos() {}

    public record TimelineEvent(String type, String label, Instant occurredAt, String detail) {}

    public record WorkflowOrder(
            Long orderId,
            String status,
            String consumerName,
            String storeName,
            String districtCode,
            int totalAmount,
            int itemCount,
            int offerCount,
            int bidCount,
            Instant createdAt,
            Instant matchDeadlineAt,
            Instant sellerConfirmationDeadlineAt,
            Instant matchedAt,
            Instant sellerConfirmedAt,
            Instant paidAt,
            Instant completedAt,
            List<TimelineEvent> timeline) {}

    public record StoreActivity(
            Long storeId,
            String storeName,
            String districtCode,
            int configuredSlots,
            int reservedSlots,
            int activeSlots,
            int availableSlots,
            boolean receivingOrders,
            boolean verified,
            double trustScore,
            List<SlotLog> slotLogs,
            List<PenaltyLog> penalties,
            List<WorkflowOrder> assignedOrders) {}

    public record SlotLog(Instant createdAt, int oldSlots, int newSlots, String changedBy, String reason) {}

    public record PenaltyLog(Long orderId, String violationType, int level, double trustScoreDelta,
            Instant restrictionUntil, String reason, Instant appliedAt) {}

    public record ForceSlotsRequest(
            @Min(0) @Max(15) int configuredSlots,
            @NotBlank String reason) {}
}
