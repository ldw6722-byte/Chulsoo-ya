package com.chulsooya.server.domain.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRefundRepository extends JpaRepository<PaymentRefund, Long> {
    Optional<PaymentRefund> findByIdempotencyKey(String idempotencyKey);
    List<PaymentRefund> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);
}
