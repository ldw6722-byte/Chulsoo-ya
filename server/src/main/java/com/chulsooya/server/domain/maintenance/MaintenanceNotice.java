package com.chulsooya.server.domain.maintenance;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name = "maintenance_notices")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MaintenanceNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "popup_enabled", nullable = false)
    private boolean popupEnabled = true;

    @Column(name = "display_start_at")
    private Instant displayStartAt;

    @Column(name = "display_end_at")
    private Instant displayEndAt;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "updated_by_user_id")
    private User updatedBy;

    public MaintenanceNotice(String title, String content, boolean popupEnabled, Instant displayStartAt, Instant displayEndAt, User actor) {
        this.title = title;
        this.content = content;
        this.popupEnabled = popupEnabled;
        this.displayStartAt = displayStartAt;
        this.displayEndAt = displayEndAt;
        this.createdBy = actor;
        this.updatedBy = actor;
    }

    public void update(String title, String content, boolean popupEnabled, Instant displayStartAt, Instant displayEndAt, User actor) {
        this.title = title;
        this.content = content;
        this.popupEnabled = popupEnabled;
        this.displayStartAt = displayStartAt;
        this.displayEndAt = displayEndAt;
        this.updatedBy = actor;
        this.updatedAt = Instant.now();
    }

    public void updateTitle(String title, User actor) {
        this.title = title;
        this.updatedBy = actor;
        this.updatedAt = Instant.now();
    }

    public void updateContent(String content, User actor) {
        this.content = content;
        this.updatedBy = actor;
        this.updatedAt = Instant.now();
    }

    public void setActive(boolean active, User actor) {
        this.active = active;
        if (active) this.activatedAt = Instant.now();
        this.updatedBy = actor;
        this.updatedAt = Instant.now();
    }

    public boolean isVisibleAt(Instant now) {
        return active && (displayStartAt == null || !now.isBefore(displayStartAt))
                && (displayEndAt == null || !now.isAfter(displayEndAt));
    }
}
