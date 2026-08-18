package com.chulsooya.server.domain.address;

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
@Table(name = "delivery_addresses", indexes = {
        @Index(name = "idx_delivery_addresses_consumer_updated", columnList = "consumer_id,updated_at")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DeliveryAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long consumerId;

    @Column(nullable = false, length = 30)
    private String label;

    @Column(nullable = false, length = 40)
    private String recipientName;

    @Column(nullable = false, length = 30)
    private String recipientPhone;

    @Column(nullable = false, length = 30)
    private String cityName;

    @Column(nullable = false, length = 30)
    private String districtName;

    @Column(nullable = false, length = 180)
    private String roadAddress;

    @Column(length = 180)
    private String addressDetail;

    @Column(name = "is_default", nullable = false)
    private boolean defaultAddress;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public DeliveryAddress(Long consumerId, String label, String recipientName, String recipientPhone,
            String cityName, String districtName, String roadAddress, String addressDetail, boolean defaultAddress) {
        this.consumerId = consumerId;
        this.label = label;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.cityName = cityName;
        this.districtName = districtName;
        this.roadAddress = roadAddress;
        this.addressDetail = emptyToNull(addressDetail);
        this.defaultAddress = defaultAddress;
    }

    public void update(String label, String recipientName, String recipientPhone,
            String cityName, String districtName, String roadAddress, String addressDetail) {
        this.label = label;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.cityName = cityName;
        this.districtName = districtName;
        this.roadAddress = roadAddress;
        this.addressDetail = emptyToNull(addressDetail);
        this.updatedAt = Instant.now();
    }

    public void markDefault() {
        this.defaultAddress = true;
        this.updatedAt = Instant.now();
    }

    public void clearDefault() {
        this.defaultAddress = false;
        this.updatedAt = Instant.now();
    }

    public String getFullAddress() {
        return String.join(" ", cityName, districtName, roadAddress).trim();
    }

    private static String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
