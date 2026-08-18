package com.chulsooya.server.domain.paymentmethod;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PaymentMethodTest {
    @Test
    @DisplayName("카드는 마지막 네 자리만 보관하고 마스킹해 응답한다")
    void masksCardNumber() {
        PaymentMethod method = PaymentMethod.create(104L, PaymentMethodType.CARD, "현대카드", "1234");

        assertThat(method.getLastFour()).isEqualTo("1234");
        assertThat(method.maskedLabel()).isEqualTo("현대카드 카드 **** 1234");
    }

    @Test
    @DisplayName("은행 계좌는 마지막 네 자리만 보관하고 마스킹해 응답한다")
    void masksBankAccountNumber() {
        PaymentMethod method = PaymentMethod.create(104L, PaymentMethodType.BANK_ACCOUNT, "NH농협", "5678");

        assertThat(method.maskedLabel()).isEqualTo("NH농협 계좌 **** 5678");
    }
}
