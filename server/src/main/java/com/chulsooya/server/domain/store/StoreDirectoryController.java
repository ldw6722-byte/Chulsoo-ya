package com.chulsooya.server.domain.store;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.store.StoreDirectoryDtos.RegionOption;
import com.chulsooya.server.domain.store.StoreDirectoryDtos.StoreResponse;

@RestController
@RequestMapping("/api/stores")
public class StoreDirectoryController {
    private final StoreDirectoryService directoryService;
    public StoreDirectoryController(StoreDirectoryService directoryService) { this.directoryService = directoryService; }
    @GetMapping
    public ApiResponse<List<StoreResponse>> find(@RequestParam(required = false) String city,
            @RequestParam(required = false) String district) {
        return ApiResponse.of(directoryService.find(city, district));
    }
    @GetMapping("/regions")
    public ApiResponse<List<RegionOption>> regions() { return ApiResponse.of(directoryService.regions()); }
}
