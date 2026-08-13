package com.chulsooya.server.domain.claim;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.claim.ClaimDtos.AdminResolutionRequest;
import com.chulsooya.server.domain.claim.ClaimDtos.ClaimDetailResponse;
import com.chulsooya.server.domain.claim.ClaimDtos.ClaimResponse;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/claims")
public class AdminClaimController {

    private final ClaimService claimService;
    private final ClaimDocumentService claimDocumentService;

    public AdminClaimController(ClaimService claimService, ClaimDocumentService claimDocumentService) {
        this.claimService = claimService;
        this.claimDocumentService = claimDocumentService;
    }

    @GetMapping
    public ApiResponse<List<ClaimResponse>> list(CurrentUser user,
            @RequestParam(defaultValue = "REQUESTED") ClaimStatus status) {
        requireAdmin(user);
        return ApiResponse.of(claimService.listByStatus(status));
    }

    @GetMapping("/{claimId}")
    public ApiResponse<ClaimDetailResponse> detail(CurrentUser user, @PathVariable Long claimId) {
        requireAdmin(user);
        return ApiResponse.of(claimService.detailForAdmin(claimId));
    }

    @GetMapping("/{claimId}/document")
    public ApiResponse<ClaimDocumentService.ClaimDecisionDocument> document(CurrentUser user,
            @PathVariable Long claimId) {
        requireAdmin(user);
        return ApiResponse.of(claimDocumentService.render(claimId));
    }

    @PostMapping("/{claimId}/resolve")
    public ApiResponse<ClaimResponse> resolve(CurrentUser user, @PathVariable Long claimId,
            @Valid @RequestBody AdminResolutionRequest request) {
        requireAdmin(user);
        return ApiResponse.of(ClaimResponse.from(claimService.resolveByAdmin(user, claimId, request.decision(),
                request.note(), request.refundAmount())));
    }

    private void requireAdmin(CurrentUser user) {
        if (!user.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }
}
