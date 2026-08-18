package com.chulsooya.server.domain.sellerdeactivation;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerDeactivationRequestRepository extends JpaRepository<SellerDeactivationRequest, Long> {
    Optional<SellerDeactivationRequest> findFirstBySellerIdOrderByRequestedAtDesc(Long sellerId);
    boolean existsBySellerIdAndStatus(Long sellerId, SellerDeactivationStatus status);
    List<SellerDeactivationRequest> findByStatusOrderByRequestedAtAsc(SellerDeactivationStatus status);
}
