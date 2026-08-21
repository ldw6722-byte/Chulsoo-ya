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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "user_feature_permissions", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "permission_code"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserFeaturePermission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Enumerated(EnumType.STRING)
    @Column(name = "permission_code", nullable = false, length = 80)
    private FeaturePermission permissionCode;
    @Column(nullable = false)
    private boolean enabled;
    @Column(name = "updated_by")
    private Long updatedBy;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserFeaturePermission(Long userId, FeaturePermission permissionCode, boolean enabled, Long updatedBy) {
        this.userId = userId;
        this.permissionCode = permissionCode;
        this.enabled = enabled;
        this.updatedBy = updatedBy;
    }

    public void change(boolean enabled, Long updatedBy) {
        this.enabled = enabled;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }
}
