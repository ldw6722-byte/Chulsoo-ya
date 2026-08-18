package com.chulsooya.server.domain.order;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.claim.SettlementService;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.order.OrderDtos.OrderResponse;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@Service
public class DevelopmentPaymentApprovalService {
    public record ApprovalHistoryResponse(OrderResponse order, Payment.Status paymentStatus, String method,
            String transactionKey, Instant approvedAt) {}
    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final OrderService orderService;
    private final SettlementService settlementService;
    private final Clock clock;

    public DevelopmentPaymentApprovalService(OrderRepository orders, PaymentRepository payments, OrderService orderService, SettlementService settlementService, Clock clock) {
        this.orders = orders;
        this.payments = payments;
        this.orderService = orderService;
        this.settlementService = settlementService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> pendingOrders(CurrentUser actor) {
        requireAdmin(actor);
        return orders.findByStatusOrderByCreatedAtAsc(OrderStatus.PAYMENT_PENDING).stream()
                .map(orderService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApprovalHistoryResponse> approvalHistory(CurrentUser actor) {
        requireAdmin(actor);
        return payments.findByMethodOrderByPaidAtDesc("DEVELOPMENT_ADMIN_APPROVAL").stream()
                .map(payment -> orders.findById(payment.getOrderId())
                        .map(order -> new ApprovalHistoryResponse(orderService.toResponse(order), payment.getStatus(),
                                payment.getMethod(), payment.getPgTransactionKey(), payment.getPaidAt()))
                        .orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    /**
     * ponytail: 개발용 관리자 승인. upgrade path: PG 승인 요청·서명 검증 웹훅이 이 상태 전환을 호출한다.
     */
    @Transactional
    public OrderResponse approve(CurrentUser actor, Long orderId) {
        requireAdmin(actor);
        Order order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
        Payment existing = payments.findByOrderId(orderId).orElse(null);
        if (existing != null && existing.getStatus() == Payment.Status.PAID
                && (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.PREPARING)) {
            return orderService.toResponse(order);
        }
        if (order.getStatus() != OrderStatus.PAYMENT_PENDING) {
            throw new DomainException(ErrorCode.PAYMENT_NOT_ALLOWED_YET);
        }
        Instant now = clock.instant();
        Payment payment = payments.save(new Payment(order.getId(), "development-admin-order-" + order.getId(),
                order.getTotalAmount(), "DEVELOPMENT_ADMIN_APPROVAL"));
        payment.markPaid("development_admin_" + UUID.randomUUID(), now);
        settlementService.ensureForApprovedPayment(order, payment, now);
        order.markPaid(now);
        order.transitionTo(OrderStatus.PREPARING, now);
        return orderService.toResponse(order);
    }

    private void requireAdmin(CurrentUser actor) {
        if (actor.role() != UserRole.ADMIN) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }
}
