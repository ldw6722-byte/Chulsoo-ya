package com.chulsooya.server.domain.order;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.order.PaymentController.ConfirmPaymentRequest;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock private OrderRepository orders;
    @Mock private PaymentRepository payments;
    @Mock private OrderService orderService;

    @Test
    void idempotency_key_from_another_order_is_rejected() {
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        Order order = paymentPendingOrder(now);
        Payment existing = new Payment(99L, "same-key", 10_000, "CARD");
        existing.markPaid("pg-existing", now);
        PaymentController controller = new PaymentController(orders, payments, orderService,
                Clock.fixed(now, ZoneOffset.UTC));

        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
        when(payments.findByIdempotencyKey("same-key")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> controller.confirm(new CurrentUser(7L, UserRole.CONSUMER),
                new ConfirmPaymentRequest(1L, "same-key", "CARD")))
                .isInstanceOf(DomainException.class)
                .extracting(error -> ((DomainException) error).getErrorCode())
                .isEqualTo(ErrorCode.DUPLICATE_IDEMPOTENCY_KEY);
    }

    private Order paymentPendingOrder(Instant now) {
        Order order = new Order(7L, "GU_TEST", FulfillmentMethod.PICKUP, null, null, null, 0);
        order.submitForMatching(now, 300);
        order.assignWinner(99L, now, 120);
        order.confirmStock(now);
        return order;
    }
}
