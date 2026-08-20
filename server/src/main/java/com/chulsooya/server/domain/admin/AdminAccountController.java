package com.chulsooya.server.domain.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin/account")
public class AdminAccountController {
    private final AdminAccountService accounts;

    public AdminAccountController(AdminAccountService accounts) {
        this.accounts = accounts;
    }

    @GetMapping("/me")
    public ApiResponse<AdminAccountDtos.AccountResponse> me(CurrentUser currentUser) {
        return ApiResponse.of(accounts.me(currentUser));
    }

    @PatchMapping("/me/status")
    public ApiResponse<AdminAccountDtos.AccountResponse> updateMyStatus(CurrentUser currentUser,
            @RequestBody AdminAccountDtos.StatusUpdateRequest request) {
        return ApiResponse.of(accounts.updateMyStatus(currentUser, request));
    }

    @GetMapping
    public ApiResponse<AdminAccountDtos.AccountListResponse> list(CurrentUser currentUser) {
        return ApiResponse.of(accounts.list(currentUser));
    }

    @PostMapping("/invite")
    public ApiResponse<AdminAccountDtos.AccountResponse> invite(CurrentUser currentUser,
            @RequestBody AdminAccountDtos.InviteRequest request) {
        return ApiResponse.of(accounts.inviteStandardAdministrator(currentUser, request));
    }
}
