package com.chulsooya.server.domain.penalty;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PenaltyRepository extends JpaRepository<Penalty, Long> {
    boolean existsByOrderIdAndViolationType(Long orderId, PenaltyViolationType violationType);
    List<Penalty> findTop50ByStoreIdOrderByAppliedAtDesc(Long storeId);
}
