package com.chulsooya.server.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministratorRoleAuditLogRepository extends JpaRepository<AdministratorRoleAuditLog, Long> {
}
