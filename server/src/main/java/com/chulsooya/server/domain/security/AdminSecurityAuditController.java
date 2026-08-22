package com.chulsooya.server.domain.security;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin/security-audits")
public class AdminSecurityAuditController {
    private final AdminAccessAuditService audits;

    public AdminSecurityAuditController(AdminAccessAuditService audits) {
        this.audits = audits;
    }

    @GetMapping
    public ApiResponse<AdminSecurityAuditResponse> recent(CurrentUser actor) {
        if (actor == null || !actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
        return ApiResponse.of(audits.recentAudit());
    }
}
