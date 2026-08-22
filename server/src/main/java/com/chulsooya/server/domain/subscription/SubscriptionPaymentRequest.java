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
@Table(name = "subscription_payment_requests")
public class SubscriptionPaymentRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long storeId;
    @Column(nullable = false)
    private Long requesterUserId;
    private Long productId;
    @Column(nullable = false, length = 100)
    private String productName;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionTier tier;
    @Column(nullable = false)
    private int amount;
    @Column(nullable = false)
    private int durationMonths;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionPaymentRequestStatus status;
    @Column(nullable = false)
    private Instant requestedAt;
    private Instant reviewedAt;
    private Long reviewedByUserId;
    @Column(length = 500)
    private String rejectionReason;

    protected SubscriptionPaymentRequest() {}

    public SubscriptionPaymentRequest(Long storeId, Long requesterUserId, Long productId, String productName,
            SubscriptionTier tier, int amount, int durationMonths, Instant requestedAt) {
        this.storeId = storeId;
        this.requesterUserId = requesterUserId;
        this.productId = productId;
        this.productName = productName;
        this.tier = tier;
        this.amount = amount;
        this.durationMonths = durationMonths;
        this.status = SubscriptionPaymentRequestStatus.PENDING;
        this.requestedAt = requestedAt;
    }

    public void approve(Long reviewerUserId, Instant reviewedAt) {
        ensurePending();
        this.status = SubscriptionPaymentRequestStatus.APPROVED;
        this.reviewedByUserId = reviewerUserId;
        this.reviewedAt = reviewedAt;
        this.rejectionReason = null;
    }

    public void reject(Long reviewerUserId, String reason, Instant reviewedAt) {
        ensurePending();
        this.status = SubscriptionPaymentRequestStatus.REJECTED;
        this.reviewedByUserId = reviewerUserId;
        this.reviewedAt = reviewedAt;
        this.rejectionReason = reason.trim();
    }

    private void ensurePending() {
        if (status != SubscriptionPaymentRequestStatus.PENDING) {
            throw new IllegalStateException("이미 처리된 구독 결제 요청입니다.");
        }
    }

    public Long getId() { return id; }
    public Long getStoreId() { return storeId; }
    public Long getRequesterUserId() { return requesterUserId; }
    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public SubscriptionTier getTier() { return tier; }
    public int getAmount() { return amount; }
    public int getDurationMonths() { return durationMonths; }
    public SubscriptionPaymentRequestStatus getStatus() { return status; }
    public Instant getRequestedAt() { return requestedAt; }
    public Instant getReviewedAt() { return reviewedAt; }
    public Long getReviewedByUserId() { return reviewedByUserId; }
    public String getRejectionReason() { return rejectionReason; }
}
