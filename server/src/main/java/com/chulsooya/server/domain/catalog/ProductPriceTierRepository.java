package com.chulsooya.server.domain.catalog;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductPriceTierRepository extends JpaRepository<ProductPriceTier, Long> {
  List<ProductPriceTier> findByProductIdAndActiveTrueOrderBySortOrderAsc(Long productId);
  List<ProductPriceTier> findByProductIdOrderBySortOrderAsc(Long productId);
  Optional<ProductPriceTier> findByIdAndProductIdAndActiveTrue(Long id, Long productId);
}
