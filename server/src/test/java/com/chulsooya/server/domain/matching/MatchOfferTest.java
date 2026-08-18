package com.chulsooya.server.domain.matching;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.chulsooya.server.domain.store.SubscriptionTier;

class MatchOfferTest {

    @Test
    void delayed_offer_cannot_be_bid_before_its_delivery_time() {
        Instant offeredAt = Instant.parse("2026-08-13T00:00:06Z");
        MatchOffer offer = new MatchOffer(1L, 2L, 0, SubscriptionTier.SILVER, offeredAt, 30);

        assertThat(offer.isReadyForBid(offeredAt.minusSeconds(1))).isFalse();
        assertThat(offer.isReadyForBid(offeredAt)).isTrue();
    }
}
