package com.chulsooya.server.domain.claim;

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

import com.chulsooya.server.domain.order.FulfillmentMethod;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.order.Payment;
import com.chulsooya.server.domain.order.PaymentRepository;
import com.chulsooya.server.domain.order.PaymentRefundService;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock private OrderRepository orders;
    @Mock private PaymentRepository payments;
    @Mock private ClaimRepository claims;
    @Mock private SettlementRepository settlements;
    @Mock private ClaimEventRepository events;
    @Mock private ClaimEvidenceRepository evidences;
    @Mock private PaymentRefundService paymentRefundService;
    @Mock private ClaimNotificationService notificationService;

    @Test
    void consumer_claim_creation_holds_settlement_and_records_an_audit_event() {
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        Order order = completedOrder(now);
        Payment payment = new Payment(1L, "payment-key", 10_000, "CARD");
        payment.markPaid("pg-key", now);
        ClaimService service = new ClaimService(orders, payments, claims, settlements, events, evidences, paymentRefundService, notificationService,
                Clock.fixed(now, ZoneOffset.UTC));

        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(order));
        when(payments.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(claims.existsActiveByOrderId(1L)).thenReturn(false);
        when(settlements.findByOrderIdForUpdate(1L)).thenReturn(Optional.empty());

        Claim claim = service.createByConsumer(1L, 7L, ClaimType.PARTIAL_REPLACEMENT,
                "DEFECT", "나사 일부가 누락되었습니다.");

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.REQUESTED);
        verify(settlements).save(any(Settlement.class));
        verify(events).save(any(ClaimEvent.class));
    }

    @Test
    void winning_seller_can_mark_claim_as_replacement_shipping_and_event_is_recorded() {
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        Claim claim = new Claim(1L, 7L, 99L, ClaimType.PARTIAL_REPLACEMENT, "DEFECT", "나사 일부 누락", now);
        ClaimService service = new ClaimService(orders, payments, claims, settlements, events, evidences, paymentRefundService, notificationService,
                Clock.fixed(now, ZoneOffset.UTC));

        when(claims.findByIdForUpdate(5L)).thenReturn(Optional.of(claim));

        service.applySellerAction(5L, 99L, SellerClaimAction.SHIP_REPLACEMENT, "재발송 접수", "TRACK-123");

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.REPLACEMENT_SHIPPING);
        verify(events).save(any(ClaimEvent.class));
    }

    @Test
    void admin_rejection_closes_claim_releases_settlement_and_records_event() {
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        Claim claim = new Claim(1L, 7L, 99L, ClaimType.RETURN, "CHANGE_OF_MIND", "단순 변심", now);
        Settlement settlement = new Settlement(1L, 99L, 3L, 10_000, now);
        settlement.hold("클레임 접수", now);
        ClaimService service = new ClaimService(orders, payments, claims, settlements, events, evidences, paymentRefundService, notificationService,
                Clock.fixed(now, ZoneOffset.UTC));

        when(claims.findByIdForUpdate(5L)).thenReturn(Optional.of(claim));
        when(settlements.findByOrderIdForUpdate(1L)).thenReturn(Optional.of(settlement));

        service.resolveByAdmin(new CurrentUser(1L, UserRole.ADMIN), 5L, AdminClaimDecision.REJECT, "증빙 부족", null);

        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.REJECTED);
        assertThat(settlement.getStatus()).isEqualTo(SettlementStatus.RELEASABLE);
        verify(events).save(any(ClaimEvent.class));
    }

    private Order completedOrder(Instant now) {
        Order order = new Order(7L, "GU_TEST", FulfillmentMethod.PICKUP, null, null, null, 0);
        order.submitForMatching(now, 300);
        order.assignWinner(99L, now, 120);
        order.confirmStock(now);
        order.markPaid(now);
        order.transitionTo(com.chulsooya.server.domain.order.OrderStatus.PREPARING, now);
        order.transitionTo(com.chulsooya.server.domain.order.OrderStatus.PICKUP_READY, now);
        order.transitionTo(com.chulsooya.server.domain.order.OrderStatus.COMPLETED, now);
        return order;
    }
}

