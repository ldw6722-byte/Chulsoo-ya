package com.chulsooya.server.domain.user;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionAuditLogRepository extends JpaRepository<PermissionAuditLog, Long> {
    List<PermissionAuditLog> findTop100ByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);
}
