package com.chulsooya.server.domain.claim;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface ClaimRepository extends JpaRepository<Claim, Long> {

    @Query("select count(claim) > 0 from Claim claim where claim.orderId = :orderId and claim.status not in ('RESOLVED', 'REJECTED')")
    boolean existsActiveByOrderId(@Param("orderId") Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select claim from Claim claim where claim.id = :claimId")
    Optional<Claim> findByIdForUpdate(@Param("claimId") Long claimId);

    List<Claim> findByConsumerIdOrderByCreatedAtDesc(Long consumerId);
    List<Claim> findByStoreIdOrderByCreatedAtDesc(Long storeId);
    List<Claim> findByStatusOrderByCreatedAtDesc(ClaimStatus status);
}
