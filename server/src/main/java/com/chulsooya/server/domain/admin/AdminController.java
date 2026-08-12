package com.chulsooya.server.domain.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    public ApiResponse<AdminDtos.OverviewResponse> overview(CurrentUser user) {
        return ApiResponse.of(adminService.overview(user));
    }
}