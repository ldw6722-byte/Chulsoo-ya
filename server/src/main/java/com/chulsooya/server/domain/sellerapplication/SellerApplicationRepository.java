package com.chulsooya.server.domain.sellerapplication;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface SellerApplicationRepository extends JpaRepository<SellerApplication, Long> {

    Optional<SellerApplication> findByApplicantId(Long applicantUserId);

    List<SellerApplication> findAllByStatusOrderBySubmittedAtAsc(SellerApplicationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select application from SellerApplication application where application.id = :id")
    Optional<SellerApplication> findByIdForUpdate(@Param("id") Long id);
}
