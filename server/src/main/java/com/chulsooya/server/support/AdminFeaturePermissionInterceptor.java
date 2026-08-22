package com.chulsooya.server.support;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.security.AdminAccessAuditService;
import com.chulsooya.server.domain.support.BusinessNotificationService;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;

/**
 * 일반관리자에게 최고관리자가 부여한 기능만 /api/admin 경로에서 실행되도록 강제한다.
 * 최고관리자는 FeaturePermissionService에서 전체 허용되므로 별도 우회하지 않는다.
 */
@Component
public class AdminFeaturePermissionInterceptor implements HandlerInterceptor {

    private static final List<Map.Entry<String, FeaturePermission>> PATH_PERMISSIONS = List.of(
            Map.entry("/api/admin/users", FeaturePermission.ADMIN_MANAGE_CONSUMERS),
            Map.entry("/api/admin/seller-deactivations", FeaturePermission.ADMIN_MANAGE_SELLERS),
            Map.entry("/api/admin/store-reviews", FeaturePermission.ADMIN_MANAGE_SUPPORT),
            Map.entry("/api/admin/stores", FeaturePermission.ADMIN_MANAGE_STORES),
            Map.entry("/api/admin/seller-applications", FeaturePermission.ADMIN_REVIEW_SELLER_APPLICATIONS),
            Map.entry("/api/admin/categories", FeaturePermission.ADMIN_MANAGE_CATALOG),
            Map.entry("/api/admin/products", FeaturePermission.ADMIN_MANAGE_CATALOG),
            Map.entry("/api/admin/catalog", FeaturePermission.ADMIN_MANAGE_CATALOG),
            Map.entry("/api/admin/coupons", FeaturePermission.ADMIN_MANAGE_EVENTS_AND_COUPONS),
            Map.entry("/api/admin/event-assets", FeaturePermission.ADMIN_MANAGE_EVENTS_AND_COUPONS),
            Map.entry("/api/admin/event-campaigns", FeaturePermission.ADMIN_MANAGE_EVENTS_AND_COUPONS),
            Map.entry("/api/admin/subscriptions", FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS),
            Map.entry("/api/admin/memberships", FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS),
            Map.entry("/api/admin/orders", FeaturePermission.ADMIN_VIEW_MATCHING),
            Map.entry("/api/admin/matching", FeaturePermission.ADMIN_VIEW_MATCHING),
            Map.entry("/api/admin/claims", FeaturePermission.ADMIN_MANAGE_SETTLEMENTS),
            Map.entry("/api/admin/payments/development", FeaturePermission.ADMIN_APPROVE_DEVELOPMENT_PAYMENTS),
            Map.entry("/api/admin/payments", FeaturePermission.ADMIN_MANAGE_SETTLEMENTS),
            Map.entry("/api/admin/settlements", FeaturePermission.ADMIN_MANAGE_SETTLEMENTS),
            Map.entry("/api/admin/refunds", FeaturePermission.ADMIN_MANAGE_SETTLEMENTS),
            Map.entry("/api/admin/support", FeaturePermission.ADMIN_MANAGE_SUPPORT),
            Map.entry("/api/admin/customer-notices", FeaturePermission.ADMIN_MANAGE_CUSTOMER_NOTICES),
            Map.entry("/api/admin/inquiries", FeaturePermission.ADMIN_MANAGE_SUPPORT),
            Map.entry("/api/admin/development-payments", FeaturePermission.ADMIN_APPROVE_DEVELOPMENT_PAYMENTS),
            Map.entry("/api/admin/payment-approvals", FeaturePermission.ADMIN_APPROVE_DEVELOPMENT_PAYMENTS));

    private final CurrentUserResolver currentUsers;
    private static final String ACTIVITY_PERMISSION = AdminFeaturePermissionInterceptor.class.getName() + ".activityPermission";
    private static final String ACTIVITY_PATH = AdminFeaturePermissionInterceptor.class.getName() + ".activityPath";

    private final FeaturePermissionService permissions;
    private final AdminAccessAuditService audits;
    private final BusinessNotificationService notifications;

    public AdminFeaturePermissionInterceptor(CurrentUserResolver currentUsers, FeaturePermissionService permissions,
            AdminAccessAuditService audits, BusinessNotificationService notifications) {
        this.currentUsers = currentUsers;
        this.permissions = permissions;
        this.audits = audits;
        this.notifications = notifications;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        CurrentUser actor;
        try {
            actor = currentUsers.resolve(request);
        } catch (DomainException exception) {
            audits.recordDenied(request, null, "UNAUTHENTICATED");
            throw exception;
        }
        if (!actor.isAdmin()) {
            audits.recordDenied(request, actor, "FORBIDDEN_ROLE");
            throw new DomainException(ErrorCode.FORBIDDEN, "관리자 계정만 접근할 수 있습니다.");
        }

        FeaturePermission permission = permissionFor(request.getRequestURI());
        if (permission != null && !permissions.has(actor, permission)) {
            audits.recordDenied(request, actor, "FORBIDDEN_FEATURE");
            permissions.require(actor, permission);
        }
        if (permission != null && isMutation(request)) {
            request.setAttribute(ACTIVITY_PERMISSION, permission);
            request.setAttribute(ACTIVITY_PATH, request.getRequestURI());
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception exception) {
        Object value = request.getAttribute(ACTIVITY_PERMISSION);
        if (!(value instanceof FeaturePermission permission) || exception != null || response.getStatus() >= 400) return;
        String path = String.valueOf(request.getAttribute(ACTIVITY_PATH));
        notifications.notifyAdminsForFeature(permission, "ADMIN_ACTIVITY", "관리자 업무가 반영되었습니다",
                permission.getLabel() + " 업무가 변경되었습니다. 세부 내용을 확인해 주세요.", targetPath(path));
    }

    private boolean isMutation(HttpServletRequest request) {
        return !HttpMethod.GET.matches(request.getMethod()) && !HttpMethod.OPTIONS.matches(request.getMethod());
    }

    private String targetPath(String path) {
        if (path.startsWith("/api/admin/event-campaigns") || path.startsWith("/api/admin/event-assets")) return "/admin?view=events";
        if (path.startsWith("/api/admin/coupons")) return "/admin?view=coupons";
        if (path.startsWith("/api/admin/payments/development")) return "/admin?view=developmentPayments";
        if (path.startsWith("/api/admin/security-audits")) return "/admin?view=securityAudit";
        FeaturePermission permission = permissionFor(path);
        if (permission == null) return "/admin";
        return switch (permission) {
            case ADMIN_MANAGE_CONSUMERS, ADMIN_MANAGE_SELLERS -> "/admin?view=users";
            case ADMIN_MANAGE_STORES -> "/admin?view=stores";
            case ADMIN_REVIEW_SELLER_APPLICATIONS -> "/admin?view=applications";
            case ADMIN_MANAGE_CATALOG -> "/admin?view=catalog";
            case ADMIN_MANAGE_EVENTS_AND_COUPONS -> "/admin?view=events";
            case ADMIN_MANAGE_SUBSCRIPTIONS -> "/admin?view=subscriptions";
            case ADMIN_VIEW_MATCHING -> "/admin?view=orders";
            case ADMIN_MANAGE_SETTLEMENTS -> "/admin?view=finance";
            case ADMIN_MANAGE_SUPPORT -> "/admin?view=support";
            case ADMIN_MANAGE_CUSTOMER_NOTICES -> "/admin?view=customerNotices";
            case ADMIN_APPROVE_DEVELOPMENT_PAYMENTS -> "/admin?view=developmentPayments";
            default -> "/admin";
        };
    }

    private FeaturePermission permissionFor(String path) {
        return PATH_PERMISSIONS.stream()
                .filter(entry -> path.startsWith(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }
}
