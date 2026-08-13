package com.chulsooya.server.domain.claim;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.claim.ClaimDtos.ClaimDetailResponse;
import com.chulsooya.server.domain.claim.ClaimDtos.ClaimResponse;
import com.chulsooya.server.domain.claim.ClaimDtos.CreateClaimRequest;
import com.chulsooya.server.domain.claim.ClaimDtos.EvidenceResponse;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class ClaimController {

    private final ClaimService claimService;
    private final ClaimEvidenceService evidenceService;

    public ClaimController(ClaimService claimService, ClaimEvidenceService evidenceService) {
        this.claimService = claimService;
        this.evidenceService = evidenceService;
    }

    @PostMapping("/orders/{orderId}/claims")
    public ApiResponse<ClaimResponse> create(CurrentUser user, @PathVariable Long orderId,
            @Valid @RequestBody CreateClaimRequest request) {
        return ApiResponse.of(ClaimResponse.from(claimService.createByConsumer(orderId, user.userId(),
                request.claimType(), request.reasonCode(), request.description())));
    }

    @GetMapping("/claims")
    public ApiResponse<List<ClaimResponse>> mine(CurrentUser user) {
        return ApiResponse.of(claimService.listByConsumer(user.userId()));
    }

    @GetMapping("/claims/{claimId}")
    public ApiResponse<ClaimDetailResponse> detail(CurrentUser user, @PathVariable Long claimId) {
        return ApiResponse.of(claimService.detailForConsumer(claimId, user.userId()));
    }

    @PostMapping(value = "/claims/{claimId}/evidences", consumes = "multipart/form-data")
    public ApiResponse<EvidenceResponse> uploadEvidence(CurrentUser user, @PathVariable Long claimId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(EvidenceResponse.from(evidenceService.upload(claimId, user, file)));
    }
}
