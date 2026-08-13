package com.chulsooya.server.domain.support;

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
@Table(name = "customer_notifications", indexes = {
        @Index(name = "idx_customer_notifications_user_created", columnList = "user_id,created_at")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CustomerNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(length = 240)
    private String targetPath;

    private Instant readAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public CustomerNotification(Long userId, String type, String title, String content, String targetPath) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.content = content;
        this.targetPath = targetPath;
    }

    public void markRead() {
        if (this.readAt == null) this.readAt = Instant.now();
    }
}
