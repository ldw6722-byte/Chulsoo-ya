package com.chulsooya.server.domain.security;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAccessAlertLogRepository extends JpaRepository<AdminAccessAlertLog, Long> {
    boolean existsByAlertTypeAndTargetKeyAndAlertedAtAfter(String alertType, String targetKey, Instant since);
    List<AdminAccessAlertLog> findTop20ByOrderByAlertedAtDesc();
}
