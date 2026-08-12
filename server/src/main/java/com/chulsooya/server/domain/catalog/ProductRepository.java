package com.chulsooya.server.domain.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @EntityGraph(attributePaths = "category")
    Optional<Product> findByIdAndActiveTrue(Long id);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByActiveTrueAndNameContainingIgnoreCase(String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByActiveTrueAndCategory_CodeIn(List<String> categoryCodes, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByActiveTrueAndCategory_CodeInAndNameContainingIgnoreCase(
            List<String> categoryCodes, String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByActiveTrueAndFeaturedTrue(Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("""
            select p from Product p
            where p.active = true
              and lower(p.name) like lower(concat('%', :keyword, '%'))
            order by p.salesCount desc, p.name asc
            """)
    List<Product> suggestions(@Param("keyword") String keyword, Pageable pageable);
}
