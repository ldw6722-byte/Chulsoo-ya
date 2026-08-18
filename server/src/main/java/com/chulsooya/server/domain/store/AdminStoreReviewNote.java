package com.chulsooya.server.domain.store;

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
@Table(name = "admin_store_review_notes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminStoreReviewNote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "store_id", nullable = false)
    private Long storeId;
    @Column(name = "author_id", nullable = false)
    private Long authorId;
    @Column(nullable = false, length = 1000)
    private String content;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public AdminStoreReviewNote(Long storeId, Long authorId, String content) {
        this.storeId = storeId;
        this.authorId = authorId;
        this.content = content.trim();
    }

    public void updateContent(String content, Instant now) {
        this.content = content.trim();
        this.updatedAt = now;
    }
}
