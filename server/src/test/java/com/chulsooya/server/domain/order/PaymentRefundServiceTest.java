package com.chulsooya.server.domain.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.coupon.CouponService;
import com.chulsooya.server.domain.claim.SettlementService;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class PaymentRefundServiceTest {

    @Mock private OrderRepository orders;
    @Mock private PaymentRepository payments;
    @Mock private PaymentRefundRepository refunds;
    @Mock private StoreRepository stores;
    @Mock private CouponService couponService;
    @Mock private SettlementService settlementService;

    @Test
    void consumer_cancel_after_payment_creates_a_cancel_audit_and_closes_order_and_payment() {
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        Order order = paidOrder(now);
        Payment payment = paidPayment(now, 10_000);
        PaymentRefundService service = new PaymentRefundService(orders, payments, refunds, stores, couponService, settlementService,
                Clock.fixed(now, ZoneOffset.UTC));

        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
        when(payments.findByOrderIdForUpdate(1L)).thenReturn(Optional.of(payment));
        when(refunds.findByIdempotencyKey("cancel-1")).thenReturn(Optional.empty());

        service.cancelByConsumer(1L, 7L, "cancel-1");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(payment.getStatus()).isEqualTo(Payment.Status.CANCELLED);
        assertThat(payment.getRemainingAmount()).isZero();
        verify(refunds).save(any(PaymentRefund.class));
    }

    @Test
    void admin_partial_refund_updates_remaining_amount_and_keeps_order_active() {
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        Order order = paidOrder(now);
        Payment payment = paidPayment(now, 10_000);
        PaymentRefundService service = new PaymentRefundService(orders, payments, refunds, stores, couponService, settlementService,
                Clock.fixed(now, ZoneOffset.UTC));
        CurrentUser admin = new CurrentUser(1L, UserRole.ADMIN);

        when(payments.findById(3L)).thenReturn(Optional.of(payment));
        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
        when(payments.findByIdForUpdate(3L)).thenReturn(Optional.of(payment));
        when(refunds.findByIdempotencyKey("refund-1")).thenReturn(Optional.empty());

        PaymentRefund refund = service.refundByAdmin(admin, 3L, 4_000, "상품 일부 반품", "refund-1");

        assertThat(refund.getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
        assertThat(payment.getRemainingAmount()).isEqualTo(6_000);
        assertThat(payment.getStatus()).isEqualTo(Payment.Status.PARTIAL_REFUNDED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
        verify(refunds).save(any(PaymentRefund.class));
    }

    private Order paidOrder(Instant now) {
        Order order = new Order(7L, "GU_TEST", FulfillmentMethod.PICKUP, null, null, null, 3_000);
        order.submitForMatching(now, 300);
        order.assignWinner(99L, now, 120);
        order.confirmStock(now);
        order.markPaid(now);
        return order;
    }

    private Payment paidPayment(Instant now, int amount) {
        Payment payment = new Payment(1L, "payment-1", amount, "CARD");
        payment.markPaid("pg-1", now);
        return payment;
    }
}
