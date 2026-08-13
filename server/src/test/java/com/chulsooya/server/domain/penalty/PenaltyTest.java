package com.chulsooya.server.domain.penalty;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class PenaltyTest {

    @Test
    void seller_confirmation_timeout_creates_a_level_three_twenty_four_hour_penalty() {
        Instant appliedAt = Instant.parse("2026-08-13T00:00:00Z");

        Penalty penalty = Penalty.sellerConfirmationTimeout(101L, 202L, appliedAt);

        assertThat(penalty.getViolationType()).isEqualTo(PenaltyViolationType.SELLER_CONFIRMATION_TIMEOUT);
        assertThat(penalty.getLevel()).isEqualTo(3);
        assertThat(penalty.getTrustScoreDelta()).isEqualTo(-10.0);
        assertThat(penalty.getRestrictionUntil()).isEqualTo(appliedAt.plusSeconds(24 * 60 * 60));
        assertThat(penalty.getReason()).contains("물품 확인");
    }
}
