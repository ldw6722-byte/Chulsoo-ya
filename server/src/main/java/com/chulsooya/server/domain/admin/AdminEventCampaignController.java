package com.chulsooya.server.domain.admin;

import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
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
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.catalog.EventAsset;
import com.chulsooya.server.domain.catalog.EventAssetRepository;
import com.chulsooya.server.domain.catalog.EventAssetType;
import com.chulsooya.server.domain.catalog.EventCampaign;
import com.chulsooya.server.domain.catalog.EventCampaignRepository;
import com.chulsooya.server.domain.catalog.ProductRepository;

@RestController
@RequestMapping("/api/admin/event-campaigns")
public class AdminEventCampaignController {
    private static final Set<String> THEMES = Set.of("blue","orange","green","purple","red","midnightSteel","sandstoneBuild","copperPipe","cleanElectric","safetyYellow","rainyRepair","springRenovation","summerCooling","autumnWood","winterInsulation","purpleTools","roseRenewal","graphiteFastener","tealPlumbing","crimsonPower","ivoryMinimal","neonNightwork");
    private static final Set<String> ICONS = Set.of("toolbox","hammer","drill","wrench","bolts","screw","pliers","tape","ladder","saw","faucet","pipe","shower","bulb","plug","fan","hardhat","shield","gloves","paint","brick","wood","box","cart","snow","spring","sun","rain","cloud","wind","asset-drill","asset-hammer","asset-wrench","asset-pliers","asset-screwdrivers","asset-tape","asset-handsaw","asset-circular-saw","asset-grinder","asset-impact","asset-bits","asset-fasteners","asset-anchor","asset-caulk","asset-roller","asset-brush","asset-pipe-wrench","asset-faucet","asset-pvc","asset-valve","asset-hardhat","asset-gloves","asset-goggles","asset-ladder","asset-cart","asset-toolbox","asset-worklight","asset-doorlock","asset-level","asset-laser","none");
    private final EventCampaignRepository campaigns;
    private final ProductRepository products;
    private final EventAssetRepository assets;

    public AdminEventCampaignController(EventCampaignRepository campaigns, ProductRepository products, EventAssetRepository assets) {
        this.campaigns = campaigns; this.products = products; this.assets = assets;
    }
    @GetMapping public ApiResponse<List<View>> list() { return ApiResponse.of(campaigns.findAllByOrderByHeroSortAscIdAsc().stream().map(this::view).toList()); }
    @PostMapping public ApiResponse<View> create(@RequestBody Request request) {
        EventCampaign campaign = new EventCampaign(required(request.name()), required(request.heroTitle()), nullable(request.heroSubtitle()), defaulted(request.badgeText(), "철수야 셀렉트"), defaulted(request.ctaText(), "행사 상품 보기"), theme(request.themeKey()), icon(request.iconKey()), themeAsset(request.themeAssetId()), iconAsset(request.iconAssetId()), Math.max(0, request.heroSort()), request.heroEnabled());
        return ApiResponse.of(view(campaigns.save(campaign)));
    }
    @PutMapping("/{id}") public ApiResponse<View> update(@PathVariable Long id, @RequestBody Request request) {
        EventCampaign campaign = campaign(id);
        Long themeAssetId = themeAsset(request.themeAssetId());
        Long iconAssetId = iconAsset(request.iconAssetId());
        campaign.update(required(request.name()), required(request.heroTitle()), nullable(request.heroSubtitle()), defaulted(request.badgeText(), "철수야 셀렉트"), defaulted(request.ctaText(), "행사 상품 보기"), theme(request.themeKey()), icon(request.iconKey()), themeAssetId, iconAssetId, Math.max(0, request.heroSort()), request.heroEnabled());
        return ApiResponse.of(view(campaigns.save(campaign)));
    }
    @PatchMapping("/{id}/active") public ApiResponse<View> setActive(@PathVariable Long id, @RequestBody ActiveRequest request) { EventCampaign campaign = campaign(id); if (request.active()) campaign.activate(); else campaign.deactivate(); return ApiResponse.of(view(campaigns.save(campaign))); }
    @DeleteMapping("/{id}") @Transactional public ApiResponse<Void> delete(@PathVariable Long id) { EventCampaign campaign = campaign(id); products.clearEventCampaign(campaign.getId()); campaigns.delete(campaign); return ApiResponse.of(null); }
    private EventCampaign campaign(Long id) { return campaigns.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사를 찾을 수 없습니다.")); }
    private EventAsset asset(Long id, EventAssetType type) { return assets.findByIdAndActiveTrue(id).filter(value -> value.getAssetType() == type).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "활성 행사 자산을 선택해 주세요.")); }
    private Long themeAsset(Long id) { return id == null ? null : asset(id, EventAssetType.THEME).getId(); }
    private Long iconAsset(Long id) { return id == null ? null : asset(id, EventAssetType.ICON).getId(); }
    private View view(EventCampaign campaign) { return View.of(campaign, campaign.getThemeAssetId() == null ? null : assets.findById(campaign.getThemeAssetId()).orElse(null), campaign.getIconAssetId() == null ? null : assets.findById(campaign.getIconAssetId()).orElse(null)); }
    private static String required(String value) { if (value == null || value.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필수 값을 입력해 주세요."); return value.trim(); }
    private static String nullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String defaulted(String value, String fallback) { return value == null || value.isBlank() ? fallback : value.trim(); }
    private static String theme(String value) { return THEMES.contains(value) ? value : "blue"; }
    private static String icon(String value) { return ICONS.contains(value) ? value : "none"; }
    public record Request(String name, String heroTitle, String heroSubtitle, String badgeText, String ctaText, String themeKey, String iconKey, Long themeAssetId, Long iconAssetId, int heroSort, boolean heroEnabled) { }
    public record ActiveRequest(boolean active) { }
    public record View(Long id, String name, String heroTitle, String heroSubtitle, String badgeText, String ctaText, String themeKey, String iconKey, Long themeAssetId, Long iconAssetId, String themeImageUrl, String iconImageUrl, int heroSort, boolean active, boolean heroEnabled) { static View of(EventCampaign c, EventAsset themeAsset, EventAsset iconAsset) { return new View(c.getId(), c.getName(), c.getHeroTitle(), c.getHeroSubtitle(), c.getBadgeText(), c.getCtaText(), c.getThemeKey(), c.getIconKey(), c.getThemeAssetId(), c.getIconAssetId(), themeAsset == null ? null : themeAsset.getPublicUrl(), iconAsset == null ? null : iconAsset.getPublicUrl(), c.getHeroSort(), c.isActive(), c.isHeroEnabled()); } }
}
