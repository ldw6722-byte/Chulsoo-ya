package com.chulsooya.server.domain.subscription;

import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import com.chulsooya.server.domain.store.SubscriptionTier;

@Entity
@Table(name = "store_subscription_history")
public class StoreSubscriptionHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long storeId;
    private Long productId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private SubscriptionTier previousTier;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private SubscriptionTier nextTier;
    private Instant previousExpiresAt;
    private Instant expiresAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private SubscriptionHistoryEvent eventType;
    private Long changedByUserId;
    @Column(length = 500)
    private String reason;
    @Column(nullable = false)
    private Instant createdAt;

    protected StoreSubscriptionHistory() {}
    public StoreSubscriptionHistory(Long storeId, Long productId, SubscriptionTier previousTier, SubscriptionTier nextTier,
            Instant previousExpiresAt, Instant expiresAt, SubscriptionHistoryEvent eventType, Long changedByUserId, String reason, Instant createdAt) {
        this.storeId = storeId; this.productId = productId; this.previousTier = previousTier; this.nextTier = nextTier;
        this.previousExpiresAt = previousExpiresAt; this.expiresAt = expiresAt; this.eventType = eventType;
        this.changedByUserId = changedByUserId; this.reason = reason; this.createdAt = createdAt;
    }
    public Long getId() { return id; }
    public Long getStoreId() { return storeId; }
    public Long getProductId() { return productId; }
    public SubscriptionTier getPreviousTier() { return previousTier; }
    public SubscriptionTier getNextTier() { return nextTier; }
    public Instant getPreviousExpiresAt() { return previousExpiresAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public SubscriptionHistoryEvent getEventType() { return eventType; }
    public Long getChangedByUserId() { return changedByUserId; }
    public String getReason() { return reason; }
    public Instant getCreatedAt() { return createdAt; }
}

