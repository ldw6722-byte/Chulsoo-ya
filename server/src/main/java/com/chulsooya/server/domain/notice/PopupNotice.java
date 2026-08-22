package com.chulsooya.server.domain.notice;

import java.time.Instant;

import com.chulsooya.server.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "popup_notices")
public class PopupNotice {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private User updatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected PopupNotice() {
    }

    public PopupNotice(String title, String content, Instant displayStartAt, Instant displayEndAt, User updatedBy) {
        update(title, content, displayStartAt, displayEndAt, updatedBy);
        this.active = false;
        this.createdAt = Instant.now();
    }

    public void update(String title, String content, Instant displayStartAt, Instant displayEndAt, User updatedBy) {
        this.title = title;
        this.content = content;
        this.displayStartAt = displayStartAt;
        this.displayEndAt = displayEndAt;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public void setActive(boolean active, User updatedBy) {
        this.active = active;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public boolean isVisibleAt(Instant now) {
        return active && (displayStartAt == null || !displayStartAt.isAfter(now)) && (displayEndAt == null || displayEndAt.isAfter(now));
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public boolean isActive() { return active; }
    public Instant getDisplayStartAt() { return displayStartAt; }
    public Instant getDisplayEndAt() { return displayEndAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
