package com.chulsooya.server.domain.subscription;

import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import com.chulsooya.server.domain.store.SubscriptionTier;

@Entity
@Table(name = "subscription_products")
public class SubscriptionProduct {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionTier tier;
    @Column(nullable = false)
    private int price;
    @Column(nullable = false)
    private int durationMonths = 1;
    @Column(length = 1000)
    private String description;
    @Column(nullable = false)
    private boolean active = true;
    @Column(nullable = false)
    private int displayOrder = 0;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected SubscriptionProduct() {}
    public SubscriptionProduct(String name, SubscriptionTier tier, int price, int durationMonths, String description, boolean active, int displayOrder, Instant now) {
        change(name, tier, price, durationMonths, description, active, displayOrder, now);
        this.createdAt = now;
    }
    public void change(String name, SubscriptionTier tier, int price, int durationMonths, String description, boolean active, int displayOrder, Instant now) {
        this.name = name.trim();
        this.tier = tier;
        this.price = price;
        this.durationMonths = durationMonths;
        this.description = description == null ? null : description.trim();
        this.active = active;
        this.displayOrder = displayOrder;
        this.updatedAt = now;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public SubscriptionTier getTier() { return tier; }
    public int getPrice() { return price; }
    public int getDurationMonths() { return durationMonths; }
    public String getDescription() { return description; }
    public boolean isActive() { return active; }
    public int getDisplayOrder() { return displayOrder; }
}

