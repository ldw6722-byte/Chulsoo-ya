package com.chulsooya.server.domain.store;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "store_reviews", uniqueConstraints = @UniqueConstraint(name = "uk_store_reviews_order", columnNames = "order_id"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreReview {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "store_id", nullable = false)
    private Long storeId;
    @Column(name = "order_id", nullable = false)
    private Long orderId;
    @Column(name = "consumer_id", nullable = false)
    private Long consumerId;
    @Column(nullable = false)
    private int rating;
    @Column(length = 1000)
    private String comment;
    @Column(nullable = false)
    private double trustDelta;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewVisibility visibility = ReviewVisibility.PUBLISHED;
    @Column(length = 300)
    private String moderationReason;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    private Instant moderatedAt;
    private Long moderatedBy;
    @Column(length = 1000)
    private String sellerReply;
    private Instant sellerRepliedAt;
    private Long sellerRepliedBy;

    public StoreReview(Long storeId, Long orderId, Long consumerId, int rating, String comment, double trustDelta) {
        this.storeId = storeId;
        this.orderId = orderId;
        this.consumerId = consumerId;
        this.rating = rating;
        this.comment = comment == null ? null : comment.trim();
        this.trustDelta = trustDelta;
    }

    public void updateComment(String comment) {
        this.comment = comment.trim();
    }
    public void moderate(boolean visible, String reason, Long adminId, Instant now) {
        this.visibility = visible ? ReviewVisibility.PUBLISHED : ReviewVisibility.HIDDEN;
        this.moderationReason = reason == null || reason.isBlank() ? null : reason.trim();
        this.moderatedBy = adminId;
        this.moderatedAt = now;
    }

    public void reply(String reply, Long actorId, Instant now) {
        this.sellerReply = reply == null ? null : reply.trim();
        this.sellerRepliedBy = actorId;
        this.sellerRepliedAt = now;
    }
    public void clearReply() {
        this.sellerReply = null;
        this.sellerRepliedBy = null;
        this.sellerRepliedAt = null;
    }
    public enum ReviewVisibility { PUBLISHED, HIDDEN }
}
