package com.chulsooya.server.domain.security;

import java.time.Instant;
import java.util.List;

public record AdminSecurityAuditResponse(
        List<AuditItem> logs,
        List<AlertItem> alerts) {

    public record AuditItem(
            Long id,
            String email,
            String ipAddress,
            String httpMethod,
            String requestPath,
            String denialType,
            String userAgent,
            Instant createdAt) {
    }

    public record AlertItem(
            Long id,
            String alertType,
            String targetKey,
            String summary,
            Instant alertedAt) {
    }
}
