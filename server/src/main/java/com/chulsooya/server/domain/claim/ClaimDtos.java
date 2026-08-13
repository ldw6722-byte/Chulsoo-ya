package com.chulsooya.server.domain.claim;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class ClaimDtos {
    private ClaimDtos() {}

    public record CreateClaimRequest(@NotNull ClaimType claimType, @NotBlank String reasonCode,
            @NotBlank String description) {}

    public record SellerActionRequest(@NotNull SellerClaimAction action, @NotBlank String note,
            String trackingNumber) {}

    public record AdminResolutionRequest(@NotNull AdminClaimDecision decision, @NotBlank String note,
            Integer refundAmount) {}

    public record EvidenceResponse(Long id, String contentType, long byteSize, Instant createdAt) {
        static EvidenceResponse from(ClaimEvidence evidence) {
            return new EvidenceResponse(evidence.getId(), evidence.getContentType(), evidence.getByteSize(),
                    evidence.getCreatedAt());
        }
    }

    public record EventResponse(Long id, String eventType, String actorRole, String detail, Instant createdAt) {
        static EventResponse from(ClaimEvent event) {
            return new EventResponse(event.getId(), event.getEventType(), event.getActorRole().name(),
                    event.getDetail(), event.getCreatedAt());
        }
    }

    public record ClaimResponse(Long id, Long orderId, ClaimType claimType, String reasonCode,
            String description, ClaimStatus status, Instant createdAt, Instant updatedAt, Instant resolvedAt) {
        static ClaimResponse from(Claim claim) {
            return new ClaimResponse(claim.getId(), claim.getOrderId(), claim.getClaimType(), claim.getReasonCode(),
                    claim.getDescription(), claim.getStatus(), claim.getCreatedAt(), claim.getUpdatedAt(),
                    claim.getResolvedAt());
        }
    }

    public record ClaimDetailResponse(ClaimResponse claim, SettlementStatus settlementStatus, String holdReason,
            List<EvidenceResponse> evidences, List<EventResponse> events) {}
}
