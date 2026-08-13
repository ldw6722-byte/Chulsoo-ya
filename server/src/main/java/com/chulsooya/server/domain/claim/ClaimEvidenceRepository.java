package com.chulsooya.server.domain.claim;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimEvidenceRepository extends JpaRepository<ClaimEvidence, Long> {
    List<ClaimEvidence> findByClaimIdOrderByCreatedAtAsc(Long claimId);
}
