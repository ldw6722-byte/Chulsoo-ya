package com.chulsooya.server.support;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;

/**
 * 일반관리자에게 최고관리자가 부여한 기능만 /api/admin 경로에서 실행되도록 강제한다.
 * 최고관리자는 FeaturePermissionService에서 전체 허용되므로 별도 우회하지 않는다.
 */
@Component
public class AdminFeaturePermissionInterceptor implements HandlerInterceptor {

    private static final List<Map.Entry<String, FeaturePermission>> PATH_PERMISSIONS = List.of(
            Map.entry("/api/admin/stores", FeaturePermission.ADMIN_MANAGE_STORES),
            Map.entry("/api/admin/seller-applications", FeaturePermission.ADMIN_REVIEW_SELLER_APPLICATIONS),
            Map.entry("/api/admin/categories", FeaturePermission.ADMIN_MANAGE_CATALOG),
            Map.entry("/api/admin/products", FeaturePermission.ADMIN_MANAGE_CATALOG),
            Map.entry("/api/admin/catalog", FeaturePermission.ADMIN_MANAGE_CATALOG),
            Map.entry("/api/admin/coupons", FeaturePermission.ADMIN_MANAGE_EVENTS_AND_COUPONS),
            Map.entry("/api/admin/event-campaigns", FeaturePermission.ADMIN_MANAGE_EVENTS_AND_COUPONS),
            Map.entry("/api/admin/subscriptions", FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS),
            Map.entry("/api/admin/memberships", FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS),
            Map.entry("/api/admin/orders", FeaturePermission.ADMIN_VIEW_MATCHING),
            Map.entry("/api/admin/matching", FeaturePermission.ADMIN_VIEW_MATCHING),
            Map.entry("/api/admin/settlements", FeaturePermission.ADMIN_MANAGE_SETTLEMENTS),
            Map.entry("/api/admin/refunds", FeaturePermission.ADMIN_MANAGE_SETTLEMENTS),
            Map.entry("/api/admin/support", FeaturePermission.ADMIN_MANAGE_SUPPORT),
            Map.entry("/api/admin/inquiries", FeaturePermission.ADMIN_MANAGE_SUPPORT),
            Map.entry("/api/admin/development-payments", FeaturePermission.ADMIN_APPROVE_DEVELOPMENT_PAYMENTS),
            Map.entry("/api/admin/payment-approvals", FeaturePermission.ADMIN_APPROVE_DEVELOPMENT_PAYMENTS));

    private final CurrentUserResolver currentUsers;
    private final FeaturePermissionService permissions;

    public AdminFeaturePermissionInterceptor(CurrentUserResolver currentUsers, FeaturePermissionService permissions) {
        this.currentUsers = currentUsers;
        this.permissions = permissions;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        FeaturePermission permission = permissionFor(request.getRequestURI());
        if (permission == null) return true;
        permissions.require(currentUsers.resolve(request), permission);
        return true;
    }

    private FeaturePermission permissionFor(String path) {
        return PATH_PERMISSIONS.stream()
                .filter(entry -> path.startsWith(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }
}
