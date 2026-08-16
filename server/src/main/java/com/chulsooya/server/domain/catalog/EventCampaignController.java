package com.chulsooya.server.domain.catalog;

import com.chulsooya.server.common.ApiResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/event-campaigns")
public class EventCampaignController {
    private final EventCampaignRepository campaigns;
    public EventCampaignController(EventCampaignRepository campaigns) { this.campaigns = campaigns; }
    @GetMapping("/hero") public ApiResponse<List<View>> hero() { return ApiResponse.of(campaigns.findByActiveTrueAndHeroEnabledTrueOrderByHeroSortAscIdAsc().stream().map(View::of).toList()); }
    @GetMapping("/{id}") public ApiResponse<View> detail(@PathVariable Long id) { EventCampaign campaign = campaigns.findById(id).filter(EventCampaign::isActive).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다.")); return ApiResponse.of(View.of(campaign)); }
    public record View(Long id, String name, String heroTitle, String heroSubtitle, String badgeText, String ctaText, String themeKey, String iconKey, int heroSort) { static View of(EventCampaign c) { return new View(c.getId(), c.getName(), c.getHeroTitle(), c.getHeroSubtitle(), c.getBadgeText(), c.getCtaText(), c.getThemeKey(), c.getIconKey(), c.getHeroSort()); } }
}
