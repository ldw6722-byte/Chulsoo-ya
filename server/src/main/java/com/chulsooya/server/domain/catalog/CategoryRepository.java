package com.chulsooya.server.domain.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByActiveTrueOrderBySortOrderAsc();

    List<Category> findByParentIsNullAndActiveTrueOrderBySortOrderAsc();

    Optional<Category> findByCodeAndActiveTrue(String code);
}
