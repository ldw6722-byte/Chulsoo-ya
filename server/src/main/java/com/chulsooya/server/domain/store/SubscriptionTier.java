package com.chulsooya.server.domain.store;

/** 판매자 멤버십: 프리미엄 30초 독점, 골드 30초 경쟁, 실버 전체 경쟁. */
public enum SubscriptionTier {
    PREMIUM(15, 0),
    GOLD(8, 30),
    SILVER(3, 60);

    private final int slotCap;
    private final int dispatchDelaySeconds;

    SubscriptionTier(int slotCap, int dispatchDelaySeconds) {
        this.slotCap = slotCap;
        this.dispatchDelaySeconds = dispatchDelaySeconds;
    }

    public int getSlotCap() { return slotCap; }
    public int getDispatchDelaySeconds() { return dispatchDelaySeconds; }
}
