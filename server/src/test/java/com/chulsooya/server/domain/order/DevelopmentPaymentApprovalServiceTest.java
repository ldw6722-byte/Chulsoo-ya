package com.chulsooya.server.domain.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.domain.claim.SettlementService;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.support.BusinessNotificationService;

import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class DevelopmentPaymentApprovalServiceTest {
    @Mock private OrderRepository orders;
    @Mock private PaymentRepository payments;
    @Mock private OrderService orderService;
    @Mock private SettlementService settlementService;
    @Mock private StoreRepository stores;
    @Mock private BusinessNotificationService notifications;

    @Test
    void admin_approval_creates_masked_development_payment_and_moves_order_to_preparing() {
        Instant now = Instant.parse("2026-08-17T03:00:00Z");
        Order order = paymentPendingOrder(now);
                DevelopmentPaymentApprovalService service = new DevelopmentPaymentApprovalService(orders, payments,
                orderService, settlementService, stores, notifications, Clock.fixed(now, ZoneOffset.UTC));

        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
        when(payments.findByOrderId(1L)).thenReturn(Optional.empty());
        when(payments.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stores.findById(202L)).thenReturn(Optional.empty());

        service.approve(new CurrentUser(109L, UserRole.ADMIN), 1L);

        ArgumentCaptor<Payment> captured = ArgumentCaptor.forClass(Payment.class);
        verify(payments).save(captured.capture());
        assertThat(captured.getValue().getMethod()).isEqualTo("DEVELOPMENT_ADMIN_APPROVAL");
        assertThat(captured.getValue().getStatus()).isEqualTo(Payment.Status.PAID);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PREPARING);
    }

    @Test
    void non_admin_cannot_approve_development_payment() {
                DevelopmentPaymentApprovalService service = new DevelopmentPaymentApprovalService(orders, payments,
                orderService, settlementService, stores, notifications, Clock.systemUTC());

        assertThatThrownBy(() -> service.approve(new CurrentUser(104L, UserRole.CONSUMER), 1L))
                .isInstanceOf(DomainException.class)
                .extracting(error -> ((DomainException) error).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    private Order paymentPendingOrder(Instant now) {
        Order order = new Order(104L, "GU_TEST", FulfillmentMethod.PICKUP, null, null, null, 0);
        order.submitForMatching(now, 300);
        order.assignWinner(202L, now, 120);
        order.confirmStock(now);
        return order;
    }
}
