package com.chulsooya.server.domain.admin;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.catalog.EventCampaign;
import com.chulsooya.server.domain.catalog.EventCampaignRepository;
import com.chulsooya.server.domain.catalog.ProductRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/event-campaigns")
public class AdminEventCampaignController {
    private static final Set<String> THEMES = Set.of("blue","orange","charcoal","green","violet","ocean","sunset","copper","lime","graphite","ruby","sky","navy","coral","mint","amber","midnight","sand","aurora","berry");
    private static final Set<String> ICONS = Set.of("toolbox","hammer","drill","wrench","bolts","screw","pliers","tape","ladder","saw","faucet","pipe","shower","bulb","plug","fan","hardhat","shield","gloves","paint","brick","wood","box","cart","snow","spring","sun","rain","cloud","wind");
    private final EventCampaignRepository campaigns;
    private final ProductRepository products;
    public AdminEventCampaignController(EventCampaignRepository campaigns, ProductRepository products) { this.campaigns = campaigns; this.products = products; }
    @GetMapping public ApiResponse<List<View>> list() { return ApiResponse.of(campaigns.findAllByOrderByHeroSortAscIdAsc().stream().map(View::of).toList()); }
    @PostMapping public ApiResponse<View> create(@RequestBody Request request) { return ApiResponse.of(View.of(campaigns.save(new EventCampaign(required(request.name()), required(request.heroTitle()), nullable(request.heroSubtitle()), defaulted(request.badgeText(), "철수야 셀렉트"), defaulted(request.ctaText(), "행사 상품 보기"), theme(request.themeKey()), icon(request.iconKey()), Math.max(0, request.heroSort()), request.heroEnabled())))); }
    @PutMapping("/{id}") public ApiResponse<View> update(@PathVariable Long id, @RequestBody Request request) { EventCampaign campaign = campaign(id); campaign.update(required(request.name()), required(request.heroTitle()), nullable(request.heroSubtitle()), defaulted(request.badgeText(), "철수야 셀렉트"), defaulted(request.ctaText(), "행사 상품 보기"), theme(request.themeKey()), icon(request.iconKey()), Math.max(0, request.heroSort()), request.heroEnabled()); return ApiResponse.of(View.of(campaigns.save(campaign))); }
    @PatchMapping("/{id}/active") public ApiResponse<View> setActive(@PathVariable Long id, @RequestBody ActiveRequest request) { EventCampaign campaign = campaign(id); if (request.active()) campaign.activate(); else campaign.deactivate(); return ApiResponse.of(View.of(campaigns.save(campaign))); }
    @DeleteMapping("/{id}") @Transactional public ApiResponse<Void> delete(@PathVariable Long id) { EventCampaign campaign = campaign(id); products.clearEventCampaign(campaign.getId()); campaigns.delete(campaign); return ApiResponse.of(null); }
    private EventCampaign campaign(Long id) { return campaigns.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다.")); }
    private static String required(String value) { if (value == null || value.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필수 값을 입력해 주세요."); return value.trim(); }
    private static String nullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String defaulted(String value, String fallback) { return value == null || value.isBlank() ? fallback : value.trim(); }
    private static String theme(String value) { return THEMES.contains(value) ? value : "blue"; }
    private static String icon(String value) { return ICONS.contains(value) ? value : "toolbox"; }
    public record Request(String name, String heroTitle, String heroSubtitle, String badgeText, String ctaText, String themeKey, String iconKey, int heroSort, boolean heroEnabled) { }
    public record ActiveRequest(boolean active) { }
    public record View(Long id, String name, String heroTitle, String heroSubtitle, String badgeText, String ctaText, String themeKey, String iconKey, int heroSort, boolean active, boolean heroEnabled) { static View of(EventCampaign c) { return new View(c.getId(), c.getName(), c.getHeroTitle(), c.getHeroSubtitle(), c.getBadgeText(), c.getCtaText(), c.getThemeKey(), c.getIconKey(), c.getHeroSort(), c.isActive(), c.isHeroEnabled()); } }
}
