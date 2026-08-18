package com.chulsooya.server.domain.admin;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.catalog.EventAsset;
import com.chulsooya.server.domain.catalog.EventAssetRepository;
import com.chulsooya.server.domain.catalog.EventAssetType;
import com.chulsooya.server.domain.catalog.EventCampaignRepository;

@RestController
@RequestMapping("/api/admin/event-assets")
public class AdminEventAssetController {
    private final EventAssetRepository assets;
    private final EventCampaignRepository campaigns;
    private final EventAssetStorage storage;
    private final EventAssetValidator validator = new EventAssetValidator();

    public AdminEventAssetController(EventAssetRepository assets, EventCampaignRepository campaigns, EventAssetStorage storage) {
        this.assets = assets;
        this.campaigns = campaigns;
        this.storage = storage;
    }

    @GetMapping
    public ApiResponse<List<View>> list() {
        return ApiResponse.of(assets.findAllByOrderByAssetTypeAscSortOrderAscIdAsc().stream().map(View::of).toList());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ApiResponse<View> create(@RequestParam EventAssetType type, @RequestParam String name,
            @RequestParam(defaultValue = "ADMIN_UPLOAD") String sourceType, @RequestParam(defaultValue = "0") int sortOrder,
            @RequestPart("file") MultipartFile file) {
        validator.validate(file);
        String normalizedSource = source(sourceType);
        String key = storage.upload(type, file, validator.extension(file));
        EventAsset asset = assets.save(new EventAsset(type, required(name), key, storage.publicUrl(key), normalizedSource, Math.max(0, sortOrder)));
        return ApiResponse.of(View.of(asset));
    }

    @PatchMapping("/{id}")
    public ApiResponse<View> update(@PathVariable Long id, @RequestBody UpdateRequest request) {
        EventAsset asset = asset(id);
        asset.update(required(request.name()), Math.max(0, request.sortOrder()), request.active());
        return ApiResponse.of(View.of(assets.save(asset)));
    }

    @PostMapping(value = "/{id}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<View> replaceFile(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        EventAsset asset = asset(id);
        validator.validate(file);
        String oldKey = asset.getStorageKey();
        String key = storage.upload(asset.getAssetType(), file, validator.extension(file));
        asset.replaceFile(key, storage.publicUrl(key));
        EventAsset saved = assets.save(asset);
        storage.delete(oldKey);
        return ApiResponse.of(View.of(saved));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> delete(@PathVariable Long id) {
        EventAsset asset = asset(id);
        if (campaigns.existsByThemeAssetIdOrIconAssetId(id, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "행사에 적용 중인 자산은 먼저 다른 자산으로 바꾼 뒤 삭제해 주세요.");
        }
        storage.delete(asset.getStorageKey());
        assets.delete(asset);
        return ApiResponse.of(null);
    }

    private EventAsset asset(Long id) { return assets.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "행사 자산을 찾을 수 없습니다.")); }
    private static String required(String value) { if (value == null || value.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "자산 이름을 입력해 주세요."); return value.trim(); }
    private static String source(String value) { return "AI_GENERATED".equals(value) ? "AI_GENERATED" : "ADMIN_UPLOAD"; }

    public record UpdateRequest(String name, int sortOrder, boolean active) { }
    public record View(Long id, EventAssetType assetType, String name, String publicUrl, String sourceType, int sortOrder, boolean active) {
        static View of(EventAsset asset) { return new View(asset.getId(), asset.getAssetType(), asset.getName(), asset.getPublicUrl(), asset.getSourceType(), asset.getSortOrder(), asset.isActive()); }
    }
}
