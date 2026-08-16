package com.chulsooya.server.domain.catalog;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ?댁쁺???뚯쑀 ?듯빀 移댄깉濡쒓렇. ?ㅻℓ???ш퀬??留ㅼ묶 ???먮ℓ???뺤씤 ?④퀎?먯꽌 ?뺤젙?쒕떎.
 */
@Entity
@Getter
@Table(name = "products")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 300)
    private String specSummary;

    @Column(length = 2000)
    private String description;

    @Column(length = 2000)
    private String specification;

    @Column(nullable = false)
    private int price;

    @Column(name = "original_price")
    private Integer originalPrice;

    @Column(name = "discount_rate")
    private Integer discountRate;
    @Column(name = "supply_cost")
    private Integer supplyCost;
    @Column(name = "select_promotion", nullable = false)
    private boolean selectPromotion = false;
    @Column(name = "event_campaign_id")
    private Long eventCampaignId;

    @Column(length = 20)
    private String unit;

    @Column(length = 500)
    private String imageUrl;

    /** '|' 援щ텇 URL 紐⑸줉. ponytail: 蹂꾨룄 ?대?吏 ?뚯씠釉붿? ?댁쁺???낅줈???붽뎄媛 ?앷만 ???꾩엯?쒕떎. */
    @Column(length = 2000)
    private String imageUrls;

    @Column(length = 100)
    private String brand;

    @Column(nullable = false)
    private double rating = 0;

    @Column(nullable = false)
    private int reviewCount = 0;

    @Column(nullable = false)
    private int salesCount = 0;

    @Column(nullable = false)
    private boolean featured = false;

    @Column(nullable = false)
    private boolean quickFulfillment = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean active = true;

    public Product(Category category, String name, String specSummary, int price, String unit, String imageUrl) {
        this.category = category;
        this.name = name;
        this.specSummary = specSummary;
        this.price = price;
        this.unit = unit;
        this.imageUrl = imageUrl;
        this.imageUrls = imageUrl;
        this.originalPrice = price;
        this.discountRate = 0;
    }

    public Product catalogInfo(
            String brand,
            String description,
            String specification,
            int originalPrice,
            double rating,
            int reviewCount,
            int salesCount,
            boolean featured,
            boolean quickFulfillment,
            String imageUrls) {
        this.brand = brand;
        this.description = description;
        this.specification = specification;
        this.originalPrice = originalPrice;
        this.discountRate = originalPrice > price ? (int) Math.round((originalPrice - price) * 100.0 / originalPrice) : 0;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.salesCount = salesCount;
        this.featured = featured;
        this.quickFulfillment = quickFulfillment;
        this.imageUrls = imageUrls == null || imageUrls.isBlank() ? imageUrl : imageUrls;
        return this;
    }

    public List<String> getImageUrls() {
        if (imageUrls == null || imageUrls.isBlank()) {
            return imageUrl == null || imageUrl.isBlank() ? List.of() : List.of(imageUrl);
        }
        return Arrays.stream(imageUrls.split("\\|"))
                .filter(value -> !value.isBlank())
                .toList();
    }
    public void updateCatalog(Category category, String name, String specSummary, String description, String specification, int price, int originalPrice, String unit, String imageUrl, String brand, boolean featured, boolean quickFulfillment, Integer supplyCost, boolean selectPromotion, Long eventCampaignId) {
        this.category = category; this.name = name; this.specSummary = specSummary; this.description = description; this.specification = specification; this.price = price; this.originalPrice = originalPrice; this.unit = unit; this.imageUrl = imageUrl; this.brand = brand; this.featured = featured; this.quickFulfillment = quickFulfillment; this.supplyCost = supplyCost; this.selectPromotion = selectPromotion; this.eventCampaignId = eventCampaignId; this.discountRate = originalPrice > price ? (int) Math.round((originalPrice - price) * 100.0 / originalPrice) : 0;
        this.imageUrls = imageUrl == null || imageUrl.isBlank() ? this.imageUrls : imageUrl;
    }
    public void updateCatalog(Category category, String name, String specSummary, String description, String specification, int price, int originalPrice, String unit, String imageUrl, String brand, boolean featured, boolean quickFulfillment) {
        updateCatalog(category, name, specSummary, description, specification, price, originalPrice, unit, imageUrl, brand, featured, quickFulfillment, null, false, null);
    }
    public void deactivate() { this.active = false; }
    public void activate() { this.active = true; }
}
