package com.chulsooya.server.domain.region;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRegionRepository extends JpaRepository<ServiceRegion, String> {
    List<ServiceRegion> findAllByActiveTrueOrderByCityNameAscDistrictNameAsc();
    Optional<ServiceRegion> findByCodeAndActiveTrue(String code);
}
