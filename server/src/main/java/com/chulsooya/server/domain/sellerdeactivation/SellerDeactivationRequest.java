package com.chulsooya.server.domain.sellerdeactivation;

import java.time.Instant;
import com.chulsooya.server.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "seller_deactivation_requests")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SellerDeactivationRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_user_id")
    private User seller;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SellerDeactivationStatus status = SellerDeactivationStatus.PENDING;
    @Column(length = 500)
    private String reason;
    @Column(nullable = false)
    private Instant requestedAt = Instant.now();
    private Instant reviewedAt;
    private Long reviewedBy;
    @Column(length = 500)
    private String rejectionReason;

    public SellerDeactivationRequest(User seller, String reason) {
        this.seller = seller;
        this.reason = reason == null || reason.isBlank() ? null : reason.trim();
    }
    public void approve(Long reviewerId) { this.status = SellerDeactivationStatus.APPROVED; this.reviewedAt = Instant.now(); this.reviewedBy = reviewerId; this.rejectionReason = null; }
    public void reject(Long reviewerId, String rejectionReason) { this.status = SellerDeactivationStatus.REJECTED; this.reviewedAt = Instant.now(); this.reviewedBy = reviewerId; this.rejectionReason = rejectionReason == null || rejectionReason.isBlank() ? "관리자 반려" : rejectionReason.trim(); }
}
