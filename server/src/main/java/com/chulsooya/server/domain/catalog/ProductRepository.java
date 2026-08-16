package com.chulsooya.server.domain.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByActiveTrue(Pageable pageable);
    Page<Product> findByActiveTrueAndNameContainingIgnoreCase(String keyword, Pageable pageable);
    Page<Product> findByActiveTrueAndCategory_CodeIn(List<String> categoryCodes, Pageable pageable);
    Page<Product> findByActiveTrueAndCategory_CodeInAndNameContainingIgnoreCase(List<String> categoryCodes, String keyword, Pageable pageable);
    Page<Product> findByActiveTrueAndFeaturedTrue(Pageable pageable);
    Optional<Product> findByIdAndActiveTrue(Long id);
    Page<Product> findByActiveTrueAndEventCampaignId(Long eventCampaignId, Pageable pageable);
    Page<Product> findByActiveTrueAndEventCampaignIdAndNameContainingIgnoreCase(Long eventCampaignId, String keyword, Pageable pageable);

    @Query("select p from Product p where p.active = true and lower(p.name) like lower(concat('%', :keyword, '%')) order by p.salesCount desc, p.id desc")
    List<Product> suggestions(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("select p from Product p")
    Page<Product> adminAll(Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("select p from Product p where p.active = :active")
    Page<Product> adminByActive(@Param("active") boolean active, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("select p from Product p where lower(p.name) like lower(concat('%', :keyword, '%')) and p.active = :active")
    Page<Product> adminByKeywordAndActive(@Param("keyword") String keyword, @Param("active") boolean active, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("select p from Product p where lower(p.name) like lower(concat('%', :keyword, '%'))")
    Page<Product> adminByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("select p from Product p join p.category c left join c.parent parent left join parent.parent grandParent where c = :category or parent = :category or grandParent = :category")
    Page<Product> adminByCategoryTree(@Param("category") Category category, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("select p from Product p join p.category c left join c.parent parent left join parent.parent grandParent where (c = :category or parent = :category or grandParent = :category) and p.active = :active")
    Page<Product> adminByCategoryTreeAndActive(@Param("category") Category category, @Param("active") boolean active, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("select p from Product p join p.category c left join c.parent parent left join parent.parent grandParent where (c = :category or parent = :category or grandParent = :category) and lower(p.name) like lower(concat('%', :keyword, '%'))")
    Page<Product> adminByCategoryTreeAndKeyword(@Param("category") Category category, @Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("select p from Product p join p.category c left join c.parent parent left join parent.parent grandParent where (c = :category or parent = :category or grandParent = :category) and lower(p.name) like lower(concat('%', :keyword, '%')) and p.active = :active")
    Page<Product> adminByCategoryTreeAndKeywordAndActive(@Param("category") Category category, @Param("keyword") String keyword, @Param("active") boolean active, Pageable pageable);

    @Modifying
    @Query("update Product p set p.eventCampaignId = null where p.eventCampaignId = :eventCampaignId")
    int clearEventCampaign(@Param("eventCampaignId") Long eventCampaignId);
}
