package com.chulsooya.server.domain.user;

import java.time.Instant;

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
@Table(name = "administrator_role_audit_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdministratorRoleAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long actorUserId;
    private Long targetUserId;

    @Enumerated(EnumType.STRING)
    private AdministratorRoleAction action;

    @Enumerated(EnumType.STRING)
    private UserRole previousRole;

    @Enumerated(EnumType.STRING)
    private AdminLevel previousAdminLevel;

    @Enumerated(EnumType.STRING)
    private UserRole nextRole;

    @Enumerated(EnumType.STRING)
    private AdminLevel nextAdminLevel;

    private Instant createdAt = Instant.now();

    public AdministratorRoleAuditLog(Long actorUserId, Long targetUserId, AdministratorRoleAction action,
            UserRole previousRole, AdminLevel previousAdminLevel, UserRole nextRole, AdminLevel nextAdminLevel) {
        this.actorUserId = actorUserId;
        this.targetUserId = targetUserId;
        this.action = action;
        this.previousRole = previousRole;
        this.previousAdminLevel = previousAdminLevel;
        this.nextRole = nextRole;
        this.nextAdminLevel = nextAdminLevel;
    }
}
