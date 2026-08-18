package com.chulsooya.server.domain.catalog;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.chulsooya.server.common.ApiResponse;

@RestController
@RequestMapping("/api/event-campaigns")
public class EventCampaignController {
    private final EventCampaignRepository campaigns;
    private final EventAssetRepository assets;
    public EventCampaignController(EventCampaignRepository campaigns, EventAssetRepository assets) { this.campaigns = campaigns; this.assets = assets; }
    @GetMapping("/hero") public ApiResponse<List<View>> hero() { return ApiResponse.of(campaigns.findByActiveTrueAndHeroEnabledTrueOrderByHeroSortAscIdAsc().stream().map(this::view).toList()); }
    @GetMapping("/{id}") public ApiResponse<View> detail(@PathVariable Long id) { return ApiResponse.of(view(campaigns.findById(id).filter(EventCampaign::isActive).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다.")))); }
    private View view(EventCampaign campaign) { EventAsset theme = campaign.getThemeAssetId() == null ? null : assets.findById(campaign.getThemeAssetId()).orElse(null); EventAsset icon = campaign.getIconAssetId() == null ? null : assets.findById(campaign.getIconAssetId()).orElse(null); return View.of(campaign, theme, icon); }
    public record View(Long id, String name, String heroTitle, String heroSubtitle, String badgeText, String ctaText, String themeKey, String iconKey, Long themeAssetId, Long iconAssetId, String themeImageUrl, String iconImageUrl, int heroSort) { static View of(EventCampaign c, EventAsset theme, EventAsset icon) { return new View(c.getId(), c.getName(), c.getHeroTitle(), c.getHeroSubtitle(), c.getBadgeText(), c.getCtaText(), c.getThemeKey(), c.getIconKey(), c.getThemeAssetId(), c.getIconAssetId(), theme == null ? null : theme.getPublicUrl(), icon == null ? null : icon.getPublicUrl(), c.getHeroSort()); } }
}
