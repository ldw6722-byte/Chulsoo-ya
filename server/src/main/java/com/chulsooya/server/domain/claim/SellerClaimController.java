package com.chulsooya.server.domain.claim;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.claim.ClaimDtos.ClaimDetailResponse;
import com.chulsooya.server.domain.claim.ClaimDtos.ClaimResponse;
import com.chulsooya.server.domain.claim.ClaimDtos.SellerActionRequest;
import com.chulsooya.server.domain.store.SellerService;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/seller/claims")
public class SellerClaimController {

    private final ClaimService claimService;
    private final SellerService sellerService;
    private final FeaturePermissionService featurePermissions;

    public SellerClaimController(ClaimService claimService, SellerService sellerService,
            FeaturePermissionService featurePermissions) {
        this.claimService = claimService;
        this.sellerService = sellerService;
        this.featurePermissions = featurePermissions;
    }

    @GetMapping
    public ApiResponse<List<ClaimResponse>> list(CurrentUser user) {
        Store store = requireStore(user);
        return ApiResponse.of(claimService.listByStore(store.getId()));
    }

    @GetMapping("/{claimId}")
    public ApiResponse<ClaimDetailResponse> detail(CurrentUser user, @PathVariable Long claimId) {
        Store store = requireStore(user);
        return ApiResponse.of(claimService.detailForStore(claimId, store.getId()));
    }

    @PostMapping("/{claimId}/actions")
    public ApiResponse<ClaimResponse> action(CurrentUser user, @PathVariable Long claimId,
            @Valid @RequestBody SellerActionRequest request) {
        Store store = requireStore(user);
        return ApiResponse.of(ClaimResponse.from(claimService.applySellerAction(claimId, store.getId(),
                request.action(), request.note(), request.trackingNumber())));
    }

    private Store requireStore(CurrentUser user) {
        if (!user.isSeller() && !user.isAdmin()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "판매자 권한이 필요합니다.");
        }
        if (user.isAdmin()) featurePermissions.require(user, FeaturePermission.SELLER_CLAIM_RESPONSE);
        return sellerService.requireStoreByOwner(user.userId());
    }
}
