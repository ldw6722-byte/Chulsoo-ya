package com.chulsooya.server.domain.store;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.store.StoreDirectoryDtos.CreateStoreRequest;
import com.chulsooya.server.domain.store.StoreDirectoryDtos.StoreResponse;
import com.chulsooya.server.domain.store.StoreDirectoryDtos.UpdateStoreRequest;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin/stores")
public class AdminStoreController {
    private final StoreDirectoryService directoryService;
    public AdminStoreController(StoreDirectoryService directoryService) { this.directoryService = directoryService; }
    @GetMapping public ApiResponse<List<StoreResponse>> list(CurrentUser user) { return ApiResponse.of(directoryService.adminList(user)); }
    @PostMapping public ApiResponse<StoreResponse> create(CurrentUser user, @Valid @RequestBody CreateStoreRequest request) { return ApiResponse.of(directoryService.create(user, request)); }
    @PatchMapping("/{storeId}") public ApiResponse<StoreResponse> update(CurrentUser user, @PathVariable Long storeId, @Valid @RequestBody UpdateStoreRequest request) { return ApiResponse.of(directoryService.update(user, storeId, request)); }
    @DeleteMapping("/{storeId}") public ApiResponse<Void> delete(CurrentUser user, @PathVariable Long storeId) { directoryService.delete(user, storeId); return ApiResponse.of(null); }
}
