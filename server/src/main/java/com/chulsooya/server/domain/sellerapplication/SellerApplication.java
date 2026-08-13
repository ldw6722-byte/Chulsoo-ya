package com.chulsooya.server.domain.sellerapplication;

import java.time.Instant;
import java.time.LocalDate;

import com.chulsooya.server.domain.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "seller_applications")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SellerApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_user_id", unique = true)
    private User applicant;

    @Column(nullable = false, length = 100)
    private String storeName;

    @Column(nullable = false, length = 100)
    private String representativeName;

    @Column(nullable = false, length = 20)
    private String businessRegistrationNumber;

    private LocalDate businessOpenedOn;

    @Column(nullable = false, length = 60)
    private String cityName;

    @Column(nullable = false, length = 60)
    private String districtName;

    @Column(nullable = false, length = 20)
    private String guCode;

    @Column(nullable = false, length = 300)
    private String address;

    @Column(nullable = false, length = 255)
    private String phone;

    @Column(length = 1000)
    private String handledItems;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SellerApplicationStatus status = SellerApplicationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NtsVerificationStatus ntsStatus = NtsVerificationStatus.NOT_REQUESTED;

    @Column(length = 500)
    private String ntsMessage;

    @Column(length = 500)
    private String certificateObjectKey;

    @Column(length = 100)
    private String certificateContentType;

    private Long certificateSizeBytes;

    @Column(nullable = false)
    private Instant submittedAt = Instant.now();

    private Long reviewedByUserId;

    private Instant reviewedAt;

    @Column(length = 500)
    private String rejectionReason;

    @Version
    private Long version;

    public SellerApplication(User applicant, String storeName, String representativeName,
            String businessRegistrationNumber, String cityName, String districtName, String guCode,
            String address, String phone, String handledItems) {
        this.applicant = applicant;
        this.storeName = required(storeName);
        this.representativeName = required(representativeName);
        this.businessRegistrationNumber = required(businessRegistrationNumber);
        this.cityName = required(cityName);
        this.districtName = required(districtName);
        this.guCode = required(guCode);
        this.address = required(address);
        this.phone = required(phone);
        this.handledItems = handledItems == null || handledItems.isBlank() ? "철물,공구" : handledItems.trim();
    }

    public void setBusinessOpenedOn(LocalDate businessOpenedOn) {
        requirePending();
        this.businessOpenedOn = businessOpenedOn;
    }

    public void markCertificateUploaded(String objectKey, String contentType, long sizeBytes) {
        requirePending();
        this.certificateObjectKey = required(objectKey);
        this.certificateContentType = required(contentType);
        this.certificateSizeBytes = sizeBytes;
    }

    public void markNtsVerification(NtsVerificationStatus next, String message) {
        if (status != SellerApplicationStatus.PENDING && status != SellerApplicationStatus.MANUAL_REVIEW) {
            throw new IllegalStateException("검토가 완료된 판매자 신청의 NTS 결과는 변경할 수 없습니다.");
        }
        this.ntsStatus = next;
        this.ntsMessage = message == null || message.isBlank() ? null : message.trim();
        if (next == NtsVerificationStatus.UNAVAILABLE) this.status = SellerApplicationStatus.MANUAL_REVIEW;
    }

    public void approve(Long reviewerUserId, Instant reviewedAt) {
        requirePending();
        this.status = SellerApplicationStatus.APPROVED;
        this.reviewedByUserId = reviewerUserId;
        this.reviewedAt = reviewedAt;
        this.rejectionReason = null;
    }

    public void reject(Long reviewerUserId, String reason, Instant reviewedAt) {
        requirePending();
        String validatedReason = required(reason);
        this.status = SellerApplicationStatus.REJECTED;
        this.reviewedByUserId = reviewerUserId;
        this.reviewedAt = reviewedAt;
        this.rejectionReason = validatedReason;
    }

    private void requirePending() {
        if (status != SellerApplicationStatus.PENDING && status != SellerApplicationStatus.MANUAL_REVIEW) {
            throw new IllegalStateException("이미 검토가 완료된 판매자 신청입니다.");
        }
    }

    private String required(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("필수 입력값이 비어 있습니다.");
        return value.trim();
    }
}
