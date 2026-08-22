package com.chulsooya.server.domain.security;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminAccessAuditLogRepository extends JpaRepository<AdminAccessAuditLog, Long> {
    @Query(value = "select 1 from (select pg_advisory_xact_lock(hashtext(:key))) as lock_result", nativeQuery = true)
    int lockPatternKey(@Param("key") String key);

    long countByIpAddressAndCreatedAtAfter(String ipAddress, Instant since);
    long countByUserIdAndCreatedAtAfter(Long userId, Instant since);
    @Query("select count(distinct a.requestPath) from AdminAccessAuditLog a where a.ipAddress = :ipAddress and a.createdAt >= :since")
    long countDistinctPathsByIpAddressSince(String ipAddress, Instant since);

    @Query("select count(distinct a.ipAddress) from AdminAccessAuditLog a where a.userId = :userId and a.createdAt >= :since")
    long countDistinctIpsByUserIdSince(Long userId, Instant since);
    Page<AdminAccessAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<AdminAccessAuditLog> findTop100ByOrderByCreatedAtDesc();
}
