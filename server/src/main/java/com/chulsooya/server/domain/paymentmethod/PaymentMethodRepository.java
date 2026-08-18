package com.chulsooya.server.domain.paymentmethod;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findByUserIdOrderByCreatedAtDesc(Long userId);
}
