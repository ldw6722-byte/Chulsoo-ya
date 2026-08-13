package com.chulsooya.server.domain.order;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

	Optional<Payment> findByIdempotencyKey(String idempotencyKey);

	Optional<Payment> findByOrderId(Long orderId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select payment from Payment payment where payment.orderId = :orderId")
	Optional<Payment> findByOrderIdForUpdate(@Param("orderId") Long orderId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select payment from Payment payment where payment.id = :paymentId")
	Optional<Payment> findByIdForUpdate(@Param("paymentId") Long paymentId);
}
