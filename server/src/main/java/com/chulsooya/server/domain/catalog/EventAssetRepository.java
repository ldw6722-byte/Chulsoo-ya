package com.chulsooya.server.domain.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventAssetRepository extends JpaRepository<EventAsset, Long> {
    List<EventAsset> findAllByOrderByAssetTypeAscSortOrderAscIdAsc();
    Optional<EventAsset> findByIdAndActiveTrue(Long id);
}
