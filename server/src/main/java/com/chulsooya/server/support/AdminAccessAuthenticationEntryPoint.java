package com.chulsooya.server.support;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.chulsooya.server.domain.security.AdminAccessAuditService;

/** 인증 전에 차단되는 /api/admin 요청도 감사 로그에 남긴다. */
@Component
public class AdminAccessAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final AdminAccessAuditService audits;

    public AdminAccessAuthenticationEntryPoint(AdminAccessAuditService audits) {
        this.audits = audits;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authenticationException) throws IOException, ServletException {
        if (request.getRequestURI().startsWith("/api/admin/")) {
            audits.recordDenied(request, null, "UNAUTHENTICATED");
        }
        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
    }
}
