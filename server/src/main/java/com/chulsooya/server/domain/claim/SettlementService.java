package com.chulsooya.server.domain.claim;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.config.AppProperties;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.order.Payment;
import com.chulsooya.server.domain.order.PaymentRepository;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;

@Service
public class SettlementService {
    public record SettlementSummary(int grossAmount, int commissionAmount, int refundedAmount, int sellerPayableAmount, long pendingCount, long holdCount) {}
    public record SettlementResponse(Long id, Long orderId, Long storeId, String storeName, Long paymentId, int grossAmount, int commissionRateBps, int commissionAmount, int refundedAmount, int sellerPayableAmount, String paymentStatus, String status, String holdReason, Instant approvedAt, Instant createdAt, Instant updatedAt) {
        static SettlementResponse from(Settlement settlement, Store store, Payment payment) {
            return new SettlementResponse(settlement.getId(), settlement.getOrderId(), settlement.getStoreId(), store == null ? null : store.getName(), settlement.getPaymentId(), settlement.getGrossAmount(), settlement.getCommissionRateBps(), settlement.getCommissionAmount(), settlement.getRefundedAmount(), settlement.getSellerPayableAmount(), payment == null ? null : payment.getStatus().name(), settlement.getStatus().name(), settlement.getHoldReason(), payment == null ? null : payment.getPaidAt(), settlement.getCreatedAt(), settlement.getUpdatedAt());
        }
    }

    private final SettlementRepository settlements;
    private final PaymentRepository payments;
    private final OrderRepository orders;
    private final StoreRepository stores;
    private final AppProperties properties;

    public SettlementService(SettlementRepository settlements, PaymentRepository payments, OrderRepository orders, StoreRepository stores, AppProperties properties) {
        this.settlements = settlements;
        this.payments = payments;
        this.orders = orders;
        this.stores = stores;
        this.properties = properties;
    }

    @Transactional
    public Settlement ensureForApprovedPayment(Order order, Payment payment, Instant now) {
        if (order.getWinningStoreId() == null) throw new IllegalStateException("낙찰 판매점 없는 주문은 정산할 수 없습니다.");
        return settlements.findByOrderIdForUpdate(order.getId())
                .orElseGet(() -> settlements.save(new Settlement(order.getId(), order.getWinningStoreId(), payment.getId(), payment.getAmount(), properties.settlement().commissionBps(), now)));
    }

    @Transactional
    public void applyRefund(Order order, Payment payment, int amount, Instant now) {
        Settlement settlement = ensureForApprovedPayment(order, payment, now);
        settlement.applyRefund(amount, now);
    }

    @Transactional
    public List<SettlementResponse> list() {
        synchronizeApprovedPayments();
        return settlements.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public SettlementSummary summary() {
        synchronizeApprovedPayments();
        List<Settlement> all = settlements.findAll();
        return new SettlementSummary(
                all.stream().mapToInt(Settlement::getGrossAmount).sum(),
                all.stream().mapToInt(Settlement::getCommissionAmount).sum(),
                all.stream().mapToInt(Settlement::getRefundedAmount).sum(),
                all.stream().mapToInt(Settlement::getSellerPayableAmount).sum(),
                all.stream().filter(s -> s.getStatus() == SettlementStatus.PENDING || s.getStatus() == SettlementStatus.RELEASABLE).count(),
                all.stream().filter(s -> s.getStatus() == SettlementStatus.HOLD).count());
    }

    private SettlementResponse toResponse(Settlement settlement) {
        Store store = stores.findById(settlement.getStoreId()).orElse(null);
        Payment payment = settlement.getPaymentId() == null ? null : payments.findById(settlement.getPaymentId()).orElse(null);
        return SettlementResponse.from(settlement, store, payment);
    }

    private void synchronizeApprovedPayments() {
        Instant now = Instant.now();
        for (Payment payment : payments.findAll()) {
            if (payment.getStatus() != Payment.Status.PAID && payment.getStatus() != Payment.Status.PARTIAL_REFUNDED && payment.getStatus() != Payment.Status.REFUNDED) continue;
            Settlement existing = settlements.findByOrderId(payment.getOrderId()).orElse(null);
            if (existing != null) {
                int expectedRefunded = payment.getAmount() - payment.getRemainingAmount();
                int missingRefund = expectedRefunded - existing.getRefundedAmount();
                if (missingRefund > 0) existing.applyRefund(missingRefund, now);
                continue;
            }
            orders.findById(payment.getOrderId()).ifPresent(order -> {
                if (order.getWinningStoreId() == null) return;
                Settlement settlement = new Settlement(order.getId(), order.getWinningStoreId(), payment.getId(), payment.getAmount(), properties.settlement().commissionBps(), now);
                int refunded = payment.getAmount() - payment.getRemainingAmount();
                if (refunded > 0) settlement.applyRefund(refunded, now);
                settlements.save(settlement);
            });
        }
    }
}
