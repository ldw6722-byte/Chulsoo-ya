package com.chulsooya.server.domain.store;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class StoreReviewDtos {
    private StoreReviewDtos() {}

    public record CreateReviewRequest(
            Long orderId,
            @Min(1) @Max(5) int rating,
            @NotBlank @Size(max = 1000) String comment) {}

    public record ModerationRequest(boolean visible, @Size(max = 300) String reason) {}
    public record ReplyRequest(@NotBlank @Size(max = 1000) String reply) {}

    public record ReviewResponse(Long id, Long storeId, Long orderId, String consumerName, int rating,
            String comment, double trustDelta, String visibility, String moderationReason,
            String sellerReply, Instant sellerRepliedAt, Instant createdAt, Instant moderatedAt) {
        static ReviewResponse from(StoreReview review, String consumerName) {
            return new ReviewResponse(review.getId(), review.getStoreId(), review.getOrderId(), consumerName,
                    review.getRating(), review.getComment(), review.getTrustDelta(), review.getVisibility().name(),
                    review.getModerationReason(), review.getSellerReply(), review.getSellerRepliedAt(), review.getCreatedAt(), review.getModeratedAt());
        }
    }

    public record ReviewEligibility(boolean eligible, String reason, Long orderId, Instant expiresAt) {}

    public record StoreDetailResponse(StoreDirectoryDtos.StoreResponse store, List<ReviewResponse> reviews,
            long reviewCount, double averageRating, ReviewEligibility eligibility) {}
}
