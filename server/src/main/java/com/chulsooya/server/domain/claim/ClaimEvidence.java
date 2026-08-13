package com.chulsooya.server.domain.claim;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "claim_evidences")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClaimEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long claimId;

    @Column(nullable = false, unique = true, length = 300)
    private String objectKey;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private long byteSize;

    @Column(nullable = false)
    private Instant createdAt;

    public ClaimEvidence(Long claimId, String objectKey, String contentType, long byteSize, Instant createdAt) {
        this.claimId = claimId;
        this.objectKey = required(objectKey, 300);
        this.contentType = required(contentType, 100);
        if (byteSize <= 0) throw new IllegalArgumentException("증빙 파일 크기가 올바르지 않습니다.");
        this.byteSize = byteSize;
        this.createdAt = createdAt;
    }

    private String required(String value, int max) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("증빙 메타데이터가 비어 있습니다.");
        String normalized = value.trim();
        if (normalized.length() > max) throw new IllegalArgumentException("증빙 메타데이터 길이가 제한을 초과했습니다.");
        return normalized;
    }
}
