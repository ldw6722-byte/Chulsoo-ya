package com.chulsooya.server.domain.store;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface StoreRepository extends JpaRepository<Store, Long> {
    Optional<Store> findByOwnerId(Long ownerId);
    List<Store> findByTierNotAndSubscriptionExpiresAtLessThanEqual(SubscriptionTier tier, java.time.Instant now);
    List<Store> findByCityNameAndVerifiedTrueOrderByRatingDescNameAsc(String cityName);
    List<Store> findByCityNameAndDistrictNameAndVerifiedTrueOrderByRatingDescNameAsc(String cityName, String districtName);
    List<Store> findByCityNameAndVerifiedTrueAndDirectoryVisibleTrueOrderByRatingDescNameAsc(String cityName);
    List<Store> findByCityNameAndDistrictNameAndVerifiedTrueAndDirectoryVisibleTrueOrderByRatingDescNameAsc(String cityName, String districtName);
    @Query("select s from Store s where s.guCode = :guCode and s.verified = true")
    List<Store> findEligible(@Param("guCode") String guCode);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Store s where s.id = :id")
    Optional<Store> findByIdForUpdate(@Param("id") Long id);
}
