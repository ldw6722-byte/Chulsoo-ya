package com.chulsooya.server.domain.matching;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.chulsooya.server.domain.store.SubscriptionTier;

class DispatchCursorTest {

    @Test
    void cursor_rotates_candidate_indexes_within_the_same_region_and_tier() {
        DispatchCursor cursor = new DispatchCursor("GU_GANGNAM", SubscriptionTier.PREMIUM);

        assertThat(cursor.nextIndex(3)).isZero();
        assertThat(cursor.nextIndex(3)).isEqualTo(1);
        assertThat(cursor.nextIndex(3)).isEqualTo(2);
        assertThat(cursor.nextIndex(3)).isZero();
    }
}
