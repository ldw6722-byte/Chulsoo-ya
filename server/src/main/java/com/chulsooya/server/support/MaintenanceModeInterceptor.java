package com.chulsooya.server.support;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.maintenance.PlatformMaintenanceModeService;

@Component
public class MaintenanceModeInterceptor implements HandlerInterceptor {

    private final PlatformMaintenanceModeService maintenance;
    private final CurrentUserResolver currentUsers;

    public MaintenanceModeInterceptor(PlatformMaintenanceModeService maintenance, CurrentUserResolver currentUsers) {
        this.maintenance = maintenance;
        this.currentUsers = currentUsers;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (HttpMethod.OPTIONS.matches(request.getMethod()) || path.equals("/api/maintenance/status") || path.equals("/api/notices/popup")) return true;
        if (!maintenance.isEnabled()) return true;
        if (path.startsWith("/api/admin/") && isHighestAdministrator(request)) return true;
        throw new DomainException(ErrorCode.MAINTENANCE_ACTIVE);
    }

    private boolean isHighestAdministrator(HttpServletRequest request) {
        try {
            return maintenance.isHighestAdministrator(currentUsers.resolve(request));
        } catch (DomainException ignored) {
            return false;
        }
    }
}
