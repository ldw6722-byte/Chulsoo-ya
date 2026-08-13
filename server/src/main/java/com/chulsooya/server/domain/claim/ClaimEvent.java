package com.chulsooya.server.domain.claim;

import java.time.Instant;

import com.chulsooya.server.domain.user.UserRole;

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

/** 클레임의 상태 변화와 운영 결정을 append-only 형태로 보존한다. */
@Entity
@Getter
@Table(name = "claim_events")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClaimEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long claimId;

    @Column(nullable = false, length = 50)
    private String eventType;

    private Long actorUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole actorRole;

    @Column(nullable = false, length = 2000)
    private String detail;

    @Column(nullable = false)
    private Instant createdAt;

    public ClaimEvent(Long claimId, String eventType, Long actorUserId, UserRole actorRole, String detail,
            Instant createdAt) {
        this.claimId = claimId;
        this.eventType = required(eventType, 50);
        this.actorUserId = actorUserId;
        this.actorRole = actorRole;
        this.detail = required(detail, 2000);
        this.createdAt = createdAt;
    }

    private String required(String value, int limit) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("이벤트 내용이 비어 있습니다.");
        String normalized = value.trim();
        if (normalized.length() > limit) throw new IllegalArgumentException("이벤트 길이가 제한을 초과했습니다.");
        return normalized;
    }
}
