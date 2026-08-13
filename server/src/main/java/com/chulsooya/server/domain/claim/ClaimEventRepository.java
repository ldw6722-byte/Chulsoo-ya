package com.chulsooya.server.domain.claim;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimEventRepository extends JpaRepository<ClaimEvent, Long> {
    List<ClaimEvent> findByClaimIdOrderByCreatedAtAsc(Long claimId);
}
