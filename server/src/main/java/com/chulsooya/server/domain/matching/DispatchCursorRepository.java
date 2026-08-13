package com.chulsooya.server.domain.matching;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.chulsooya.server.domain.store.SubscriptionTier;

import jakarta.persistence.LockModeType;

public interface DispatchCursorRepository extends JpaRepository<DispatchCursor, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select cursor from DispatchCursor cursor where cursor.guCode = :guCode and cursor.tier = :tier")
    Optional<DispatchCursor> findByGuCodeAndTierForUpdate(@Param("guCode") String guCode,
            @Param("tier") SubscriptionTier tier);
}
