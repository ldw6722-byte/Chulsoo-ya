package com.chulsooya.server.domain.catalog;

import java.time.Instant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "event_assets")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EventAsset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Enumerated(EnumType.STRING) @Column(name = "asset_type", nullable = false, length = 12) private EventAssetType assetType;
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "storage_key", nullable = false, length = 255, unique = true) private String storageKey;
    @Column(name = "public_url", nullable = false, length = 700) private String publicUrl;
    @Column(name = "source_type", nullable = false, length = 24) private String sourceType;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();

    public EventAsset(EventAssetType assetType, String name, String storageKey, String publicUrl, String sourceType, int sortOrder) {
        this.assetType = assetType;
        this.name = name;
        this.storageKey = storageKey;
        this.publicUrl = publicUrl;
        this.sourceType = sourceType;
        this.sortOrder = sortOrder;
    }

    public boolean isTheme() { return assetType == EventAssetType.THEME; }
    public boolean isIcon() { return assetType == EventAssetType.ICON; }
    public void update(String name, int sortOrder, boolean active) {
        this.name = name;
        this.sortOrder = sortOrder;
        this.active = active;
        this.updatedAt = Instant.now();
    }
    public void replaceFile(String storageKey, String publicUrl) {
        this.storageKey = storageKey;
        this.publicUrl = publicUrl;
        this.updatedAt = Instant.now();
    }
}
