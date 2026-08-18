package com.chulsooya.server.domain.store;

import java.time.Instant;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 판매자 매장. 가용량 불변식: available = configured - reserved - active.
 * 디렉터리 프로필은 탐색·관리용이며 매칭 슬롯 회계와 분리한다.
 */
@Entity
@Getter
@Table(name = "stores")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User owner;
    @Column(nullable = false, length = 100)
    private String name;
    /** 카카오 로컬 API로 정규화한 행정구역 코드. 매칭 자격의 기준. */
    @Column(nullable = false, length = 20)
    private String guCode;
    @Column(length = 60)
    private String cityName = "서울특별시";
    @Column(length = 60)
    private String districtName;
    @Column(length = 300)
    private String address;
    private String phone;
    @Column(length = 500)
    private String imageUrl;
    /** 쉼표로 구분한 취급 품목. ponytail: 별도 품목 카탈로그 관계는 실제 재고 연동 시 추가. */
    @Column(length = 1000)
    private String handledItems = "철물,공구";
    @Column(nullable = false)
    private double rating = 4.0;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionTier tier = SubscriptionTier.SILVER;
    @Column(name = "subscription_expires_at")
    private Instant subscriptionExpiresAt;
    @Column(nullable = false)
    private boolean verified = false;
    @Column(nullable = false)
    private boolean receivingOrders = true;
    @Column(nullable = false)
    private boolean directoryVisible = true;
    @Column(length = 60)
    private String customerBadgeText;
    @Column(length = 200)
    private String customerNoticeText;
    @Column(nullable = false)
    private int configuredSlots = 3;
    @Column(nullable = false)
    private int reservedSlots = 0;
    @Column(nullable = false)
    private int activeSlots = 0;
    private Instant restrictedUntil;
    @Column(nullable = false)
    private double trustScore = 60.0;
    @Version
    private Long version;

    public Store(User owner, String name, String guCode, String address, String phone, SubscriptionTier tier) {
        this.owner = owner;
        this.name = name;
        this.guCode = guCode;
        this.address = address;
        this.phone = phone;
        this.tier = tier;
        this.configuredSlots = Math.min(3, tier.getSlotCap());
    }

    public int getTierSlotCap() { return tier.getSlotCap(); }
    public int getAvailableSlots() { return Math.max(0, configuredSlots - reservedSlots - activeSlots); }
    public boolean isRestricted(Instant now) { return restrictedUntil != null && restrictedUntil.isAfter(now); }
    public boolean canReceiveOffer(Instant now) { return verified && receivingOrders && !isRestricted(now) && getAvailableSlots() > 0; }

    public void changeDirectoryProfile(String name, String cityName, String districtName, String guCode,
            String address, String phone, String imageUrl, String handledItems) {
        this.name = name.trim();
        this.cityName = cityName.trim();
        this.districtName = districtName.trim();
        this.guCode = guCode.trim();
        this.address = address.trim();
        this.phone = phone.trim();
        this.imageUrl = imageUrl == null || imageUrl.isBlank() ? null : imageUrl.trim();
        this.handledItems = handledItems == null || handledItems.isBlank() ? "철물,공구" : handledItems.trim();
    }

    public void changeRating(double next) {
        if (next < 0 || next > 5) throw new DomainException(ErrorCode.VALIDATION_FAILED, "별점은 0.0 ~ 5.0 사이여야 합니다.");
        this.rating = next;
    }

    public void changeOperatingStatus(boolean verified, boolean receivingOrders) {
        this.verified = verified;
        this.receivingOrders = receivingOrders;
    }
    public void changeCustomerDisplaySettings(String badgeText, String noticeText, boolean directoryVisible) {
        this.customerBadgeText = badgeText == null || badgeText.isBlank() ? null : badgeText.trim();
        this.customerNoticeText = noticeText == null || noticeText.isBlank() ? null : noticeText.trim();
        this.directoryVisible = directoryVisible;
    }

    public void changeConfiguredSlots(int next) {
        if (next < 0 || next > getTierSlotCap()) {
            throw new DomainException(ErrorCode.SLOT_CAP_EXCEEDED, "설정 가능한 슬롯 범위는 0 ~ %d 입니다.".formatted(getTierSlotCap()));
        }
        this.configuredSlots = next;
    }
    public void enterBusyMode() { this.configuredSlots = 0; this.receivingOrders = false; }
    public void resumeReceiving(int configured) { changeConfiguredSlots(configured); this.receivingOrders = true; }
    public void reserveSlot() {
        if (getAvailableSlots() <= 0) throw new DomainException(ErrorCode.SLOT_FULL);
        this.reservedSlots++;
    }
    public void releaseReservedSlot() { this.reservedSlots = Math.max(0, this.reservedSlots - 1); }
    public void convertReservedToActive() { this.reservedSlots = Math.max(0, this.reservedSlots - 1); this.activeSlots++; }
    public void releaseActiveSlot() { this.activeSlots = Math.max(0, this.activeSlots - 1); }
    public void restrictUntil(Instant until) { this.restrictedUntil = until; }
    public void verify() { this.verified = true; }
    public void changeTier(SubscriptionTier next) {
        this.tier = next;
        if (this.configuredSlots > next.getSlotCap()) this.configuredSlots = next.getSlotCap();
    }
    public Instant getSubscriptionExpiresAt() { return subscriptionExpiresAt; }
    public boolean hasActivePaidMembership(Instant now) {
        return tier != SubscriptionTier.SILVER && subscriptionExpiresAt != null && subscriptionExpiresAt.isAfter(now);
    }
    public void activateMembership(SubscriptionTier next, Instant expiresAt) {
        if (next == SubscriptionTier.SILVER || expiresAt == null) {
            changeTier(SubscriptionTier.SILVER);
            subscriptionExpiresAt = null;
            return;
        }
        changeTier(next);
        subscriptionExpiresAt = expiresAt;
    }
    public boolean expireMembershipIfNeeded(Instant now) {
        if (tier == SubscriptionTier.SILVER || subscriptionExpiresAt == null || subscriptionExpiresAt.isAfter(now)) return false;
        changeTier(SubscriptionTier.SILVER);
        subscriptionExpiresAt = null;
        return true;
    }
    public void adjustTrustScore(double delta) { this.trustScore = Math.max(0, Math.min(100, this.trustScore + delta)); }
}
