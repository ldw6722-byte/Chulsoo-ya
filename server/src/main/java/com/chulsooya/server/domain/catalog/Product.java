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
 * 운영자 소유 통합 카탈로그. 실매장 재고는 매칭 후 판매자 확인 단계에서 확정한다.
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

    @Column(length = 20)
    private String unit;

    @Column(length = 500)
    private String imageUrl;

    /** '|' 구분 URL 목록. ponytail: 별도 이미지 테이블은 운영자 업로드 요구가 생길 때 도입한다. */
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
}
