package com.chulsooya.server.domain.support;

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
@Table(name = "customer_notices")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CustomerNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "display_start_at")
    private Instant displayStartAt;

    @Column(name = "display_end_at")
    private Instant displayEndAt;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "updated_by_user_id")
    private User updatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public CustomerNotice(String title, String content, Instant displayStartAt, Instant displayEndAt, User actor) {
        this.title = title;
        this.content = content;
        this.displayStartAt = displayStartAt;
        this.displayEndAt = displayEndAt;
        this.createdBy = actor;
        this.updatedBy = actor;
    }

    public void update(String title, String content, Instant displayStartAt, Instant displayEndAt, User actor) {
        this.title = title;
        this.content = content;
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
