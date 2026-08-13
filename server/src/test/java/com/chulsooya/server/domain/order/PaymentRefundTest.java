package com.chulsooya.server.domain.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class PaymentRefundTest {

    @Test
    void partial_refunds_reduce_remaining_amount_and_full_refund_closes_payment() {
        Payment payment = paidPayment(10_000);

        payment.applyRefund(4_000);

        assertThat(payment.getRemainingAmount()).isEqualTo(6_000);
        assertThat(payment.getStatus()).isEqualTo(Payment.Status.PARTIAL_REFUNDED);

        payment.applyRefund(6_000);

        assertThat(payment.getRemainingAmount()).isZero();
        assertThat(payment.getStatus()).isEqualTo(Payment.Status.REFUNDED);
    }

    @Test
    void refund_cannot_exceed_the_remaining_amount() {
        Payment payment = paidPayment(10_000);
        payment.applyRefund(4_000);

        assertThatThrownBy(() -> payment.applyRefund(6_001)).isInstanceOf(IllegalArgumentException.class);
        assertThat(payment.getRemainingAmount()).isEqualTo(6_000);
    }

    private Payment paidPayment(int amount) {
        Payment payment = new Payment(1L, "payment-key", amount, "CARD");
        payment.markPaid("pg-key", Instant.parse("2026-08-13T00:00:00Z"));
        return payment;
    }
}
