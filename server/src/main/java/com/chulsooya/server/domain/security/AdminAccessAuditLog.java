package com.chulsooya.server.domain.security;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "admin_access_audit_logs", indexes = {
        @Index(name = "idx_admin_audit_ip_created", columnList = "ip_address,created_at"),
        @Index(name = "idx_admin_audit_user_created", columnList = "user_id,created_at"),
        @Index(name = "idx_admin_audit_created", columnList = "created_at")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminAccessAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(length = 255)
    private String email;

    @Column(nullable = false, length = 45)
    private String ipAddress;

    @Column(nullable = false, length = 10)
    private String httpMethod;

    @Column(nullable = false, length = 500)
    private String requestPath;

    @Column(nullable = false, length = 30)
    private String denialType;

    @Column(length = 512)
    private String userAgent;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public AdminAccessAuditLog(Long userId, String email, String ipAddress, String httpMethod,
            String requestPath, String denialType, String userAgent) {
        this.userId = userId;
        this.email = email;
        this.ipAddress = ipAddress;
        this.httpMethod = httpMethod;
        this.requestPath = requestPath;
        this.denialType = denialType;
        this.userAgent = userAgent;
    }
}
