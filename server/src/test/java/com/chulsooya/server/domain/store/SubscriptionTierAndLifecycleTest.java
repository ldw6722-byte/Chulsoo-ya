package com.chulsooya.server.domain.store;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

class SubscriptionTierAndLifecycleTest {
    @Test
    void membership_tiers_follow_the_30_second_competition_windows() {
        assertThat(SubscriptionTier.PREMIUM.getDispatchDelaySeconds()).isZero();
        assertThat(SubscriptionTier.GOLD.getDispatchDelaySeconds()).isEqualTo(30);
        assertThat(SubscriptionTier.SILVER.getDispatchDelaySeconds()).isEqualTo(60);
    }

    @Test
    void paid_membership_keeps_its_expiry_and_reverts_to_silver_when_expired() {
        Store store = new Store(new User("seller@chulsooya.dev", "테스트 판매자", "010", UserRole.SELLER),
                "테스트 철물점", "GU_TEST", "서울특별시 테스트구", "02", SubscriptionTier.SILVER);
        Instant startedAt = Instant.parse("2026-08-17T00:00:00Z");
        Instant expiresAt = startedAt.plusSeconds(30L * 24 * 60 * 60);

        store.activateMembership(SubscriptionTier.GOLD, expiresAt);

        assertThat(store.getTier()).isEqualTo(SubscriptionTier.GOLD);
        assertThat(store.getSubscriptionExpiresAt()).isEqualTo(expiresAt);
        assertThat(store.expireMembershipIfNeeded(expiresAt.minusSeconds(1))).isFalse();
        assertThat(store.expireMembershipIfNeeded(expiresAt)).isTrue();
        assertThat(store.getTier()).isEqualTo(SubscriptionTier.SILVER);
        assertThat(store.getSubscriptionExpiresAt()).isNull();
    }
}
