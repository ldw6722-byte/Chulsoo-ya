package com.chulsooya.server.domain.user;

import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "permission_audit_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PermissionAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;
    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;
    @Enumerated(EnumType.STRING)
    @Column(name = "permission_code", nullable = false, length = 80)
    private FeaturePermission permissionCode;
    @Column(name = "previous_enabled")
    private Boolean previousEnabled;
    @Column(name = "next_enabled", nullable = false)
    private boolean nextEnabled;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public PermissionAuditLog(Long actorUserId, Long targetUserId, FeaturePermission permissionCode,
            Boolean previousEnabled, boolean nextEnabled) {
        this.actorUserId = actorUserId;
        this.targetUserId = targetUserId;
        this.permissionCode = permissionCode;
        this.previousEnabled = previousEnabled;
        this.nextEnabled = nextEnabled;
    }
}
