package com.chulsooya.server.domain.claim;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class SettlementTest {
    @Test
    void calculates_seller_payable_after_development_commission_and_partial_refund() {
        Instant now = Instant.parse("2026-08-17T03:00:00Z");
        Settlement settlement = new Settlement(9L, 101L, 9L, 137_500, 1_000, now);

        assertThat(settlement.getGrossAmount()).isEqualTo(137_500);
        assertThat(settlement.getCommissionAmount()).isEqualTo(13_750);
        assertThat(settlement.getRefundedAmount()).isZero();
        assertThat(settlement.getSellerPayableAmount()).isEqualTo(123_750);

        settlement.applyRefund(20_000, now.plusSeconds(1));

        assertThat(settlement.getRefundedAmount()).isEqualTo(20_000);
        assertThat(settlement.getCommissionAmount()).isEqualTo(11_750);
        assertThat(settlement.getSellerPayableAmount()).isEqualTo(105_750);
        assertThat(settlement.getStatus()).isEqualTo(SettlementStatus.PENDING);
    }

    @Test
    void full_refund_cancels_unpaid_settlement() {
        Instant now = Instant.parse("2026-08-17T03:00:00Z");
        Settlement settlement = new Settlement(9L, 101L, 9L, 10_000, 1_000, now);

        settlement.applyRefund(10_000, now.plusSeconds(1));

        assertThat(settlement.getRefundedAmount()).isEqualTo(10_000);
        assertThat(settlement.getCommissionAmount()).isZero();
        assertThat(settlement.getSellerPayableAmount()).isZero();
        assertThat(settlement.getStatus()).isEqualTo(SettlementStatus.CANCELLED);
    }
}
