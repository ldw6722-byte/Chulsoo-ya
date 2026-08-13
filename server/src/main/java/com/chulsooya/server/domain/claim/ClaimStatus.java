package com.chulsooya.server.domain.claim;

public enum ClaimStatus {
    REQUESTED,
    SELLER_REVIEWING,
    PICKUP_SCHEDULED,
    REPLACEMENT_SHIPPING,
    ESCALATED,
    RESOLVED,
    REJECTED
}
