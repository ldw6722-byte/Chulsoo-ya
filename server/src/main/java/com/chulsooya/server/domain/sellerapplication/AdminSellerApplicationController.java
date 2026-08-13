package com.chulsooya.server.domain.sellerapplication;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.AdminResponse;
import com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.ApplicantResponse;
import com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.RejectRequest;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/seller-applications")
public class AdminSellerApplicationController {

    private final SellerApplicationService applications;

    public AdminSellerApplicationController(SellerApplicationService applications) {
        this.applications = applications;
    }

    @GetMapping
    public ApiResponse<List<AdminResponse>> list(CurrentUser actor,
            @RequestParam(required = false) SellerApplicationStatus status) {
        return ApiResponse.of(applications.adminList(actor, status));
    }

    @PostMapping("/{applicationId}/approve")
    public ApiResponse<ApplicantResponse> approve(CurrentUser actor, @PathVariable Long applicationId) {
        return ApiResponse.of(applications.approve(actor, applicationId));
    }

    @PostMapping("/{applicationId}/reject")
    public ApiResponse<AdminResponse> reject(CurrentUser actor, @PathVariable Long applicationId,
            @Valid @RequestBody RejectRequest request) {
        return ApiResponse.of(applications.reject(actor, applicationId, request.reason()));
    }
}
