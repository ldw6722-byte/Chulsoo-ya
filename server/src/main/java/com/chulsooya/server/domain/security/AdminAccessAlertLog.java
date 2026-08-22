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
@Table(name = "admin_access_alert_logs", indexes = {
        @Index(name = "idx_admin_alert_type_target", columnList = "alert_type,target_key,alerted_at")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminAccessAlertLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String alertType;

    @Column(nullable = false, length = 255)
    private String targetKey;

    @Column(nullable = false)
    private Instant alertedAt = Instant.now();

    @Column(nullable = false, length = 1000)
    private String summary;

    public AdminAccessAlertLog(String alertType, String targetKey, String summary) {
        this.alertType = alertType;
        this.targetKey = targetKey;
        this.summary = summary;
    }
}
