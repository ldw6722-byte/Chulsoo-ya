package com.chulsooya.server.domain.store;

/**
 * README.ko.md 3.4: 등급별 슬롯 한도. 프리미엄 1~15, 일반 1~8, 무료/신규 1~3.
 * tierDelaySeconds: 계층형 분산 매칭의 알림 지연(0/3/6초).
 */
public enum SubscriptionTier {

	PREMIUM(15, 0),
	STANDARD(8, 3),
	FREE(3, 6);

	private final int slotCap;
	private final int dispatchDelaySeconds;

	SubscriptionTier(int slotCap, int dispatchDelaySeconds) {
		this.slotCap = slotCap;
		this.dispatchDelaySeconds = dispatchDelaySeconds;
	}

	public int getSlotCap() {
		return slotCap;
	}

	public int getDispatchDelaySeconds() {
		return dispatchDelaySeconds;
	}
}
