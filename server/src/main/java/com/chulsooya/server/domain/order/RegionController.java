package com.chulsooya.server.domain.order;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.region.ServiceRegionService;

/** 판매점 등록·주문 주소의 공식 시군구 코드 조회 API. */
@RestController
@RequestMapping("/api/regions")
public class RegionController {
    public record ResolveResponse(String guCode, String guName, String cityName, String districtName, String normalizedAddress) {}

    private final ServiceRegionService regions;

    public RegionController(ServiceRegionService regions) {
        this.regions = regions;
    }

    @GetMapping
    public ApiResponse<List<ServiceRegionService.RegionView>> list() {
        return ApiResponse.of(regions.list());
    }

    @GetMapping("/resolve")
    public ApiResponse<ResolveResponse> resolve(@RequestParam String address) {
        ServiceRegionService.RegionView region = regions.resolveAddress(address);
        return ApiResponse.of(new ResolveResponse(region.code(), region.displayName(), region.cityName(), region.districtName(), address.trim()));
    }
}
