package com.chulsooya.server.domain.maintenance;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.chulsooya.server.domain.user.User;

@Entity
@Getter
@Table(name = "platform_maintenance_mode")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlatformMaintenanceMode {

    @Id
    @Column(name = "singleton_id")
    private Long singletonId = 1L;

    @Column(nullable = false)
    private boolean enabled;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenancePhase phase = MaintenancePhase.NORMAL;

    @Column(name = "planned_start_at")
    private Instant plannedStartAt;

    @Column(name = "planned_end_at")
    private Instant plannedEndAt;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @ManyToOne
    @JoinColumn(name = "updated_by_user_id")
    private User updatedBy;

    public PlatformMaintenanceMode(boolean enabled) {
        update(enabled ? MaintenancePhase.MAINTENANCE : MaintenancePhase.NORMAL, null, null, null);
    }

    public void update(MaintenancePhase phase, Instant plannedStartAt, Instant plannedEndAt, User actor) {
        this.phase = phase;
        this.enabled = phase == MaintenancePhase.MAINTENANCE;
        this.plannedStartAt = plannedStartAt;
        this.plannedEndAt = plannedEndAt;
        this.updatedBy = actor;
        this.updatedAt = Instant.now();
    }
}
