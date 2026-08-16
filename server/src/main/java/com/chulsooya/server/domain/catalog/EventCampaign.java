package com.chulsooya.server.domain.catalog;

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
@Table(name = "event_campaigns")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EventCampaign {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "hero_title", nullable = false, length = 160) private String heroTitle;
    @Column(name = "hero_subtitle", length = 300) private String heroSubtitle;
    @Column(name = "badge_text", nullable = false, length = 60) private String badgeText = "철수야 셀렉트";
    @Column(name = "cta_text", nullable = false, length = 60) private String ctaText = "행사 상품 보기";
    @Column(name = "theme_key", nullable = false, length = 30) private String themeKey = "blue";
    @Column(name = "icon_key", nullable = false, length = 30) private String iconKey = "toolbox";
    @Column(name = "hero_sort", nullable = false) private int heroSort = 0;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "hero_enabled", nullable = false) private boolean heroEnabled = true;

    public EventCampaign(String name, String heroTitle, String heroSubtitle, String badgeText, String ctaText, String themeKey, String iconKey, int heroSort, boolean heroEnabled) { update(name, heroTitle, heroSubtitle, badgeText, ctaText, themeKey, iconKey, heroSort, heroEnabled); }
    public void update(String name, String heroTitle, String heroSubtitle, String badgeText, String ctaText, String themeKey, String iconKey, int heroSort, boolean heroEnabled) { this.name = name; this.heroTitle = heroTitle; this.heroSubtitle = heroSubtitle; this.badgeText = badgeText; this.ctaText = ctaText; this.themeKey = themeKey; this.iconKey = iconKey; this.heroSort = heroSort; this.heroEnabled = heroEnabled; }
    public void activate() { this.active = true; }
    public void deactivate() { this.active = false; }
}
