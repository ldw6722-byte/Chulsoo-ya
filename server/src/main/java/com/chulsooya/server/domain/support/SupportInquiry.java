package com.chulsooya.server.domain.support;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "support_inquiries", indexes = {
        @Index(name = "idx_support_inquiries_consumer_created", columnList = "consumer_id,created_at"),
        @Index(name = "idx_support_inquiries_status_created", columnList = "status,created_at")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SupportInquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long consumerId;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 3000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupportInquiryStatus status = SupportInquiryStatus.OPEN;

    @Column(length = 3000)
    private String adminReply;

    private Long replyAdminId;
    private Instant answeredAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public SupportInquiry(Long consumerId, String category, String title, String content) {
        this.consumerId = consumerId;
        this.category = category;
        this.title = title;
        this.content = content;
    }

    public void answer(Long adminId, String reply) {
        this.replyAdminId = adminId;
        this.adminReply = reply;
        this.answeredAt = Instant.now();
        this.status = SupportInquiryStatus.ANSWERED;
        this.updatedAt = this.answeredAt;
    }

    public void changeStatus(SupportInquiryStatus next) {
        this.status = next;
        this.updatedAt = Instant.now();
    }
}
