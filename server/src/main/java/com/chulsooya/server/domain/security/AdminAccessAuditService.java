package com.chulsooya.server.domain.security;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.domain.support.BusinessNotificationService;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.support.CurrentUser;

/**
 * /api/admin 권한 거부를 영속 감사하고, 반복 패턴을 관리자 공통 알림으로 전파한다.
 * ponytail: 실시간 차단·IP 평판 연동은 범위에서 제외하고 DB 기반 관찰·경보만 제공한다.
 */
@Service
public class AdminAccessAuditService {
    private static final Duration SHORT_WINDOW = Duration.ofMinutes(10);
    private static final Duration ALERT_COOLDOWN = Duration.ofMinutes(30);
    private static final long RAPID_REPEAT_THRESHOLD = 5;
    private static final long PATH_SCAN_THRESHOLD = 4;
    private static final long DISTRIBUTED_IP_THRESHOLD = 3;

    private final AdminAccessAuditLogRepository audits;
    private final AdminAccessAlertLogRepository alerts;
    private final UserRepository users;
    private final BusinessNotificationService notifications;

    public AdminAccessAuditService(AdminAccessAuditLogRepository audits, AdminAccessAlertLogRepository alerts,
            UserRepository users, BusinessNotificationService notifications) {
        this.audits = audits;
        this.alerts = alerts;
        this.users = users;
        this.notifications = notifications;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordDenied(HttpServletRequest request, CurrentUser actor, String denialType) {
        Long userId = actor == null ? null : actor.userId();
        String email = userId == null ? null : users.findById(userId).map(user -> user.getEmail()).orElse(null);
        String ipAddress = clientIp(request);
        String path = request.getRequestURI();
        Stream.concat(Stream.of("ip:" + ipAddress), userId == null ? Stream.empty() : Stream.of("user:" + userId))
                .sorted()
                .forEach(audits::lockPatternKey);
        audits.save(new AdminAccessAuditLog(userId, email, ipAddress, request.getMethod(), path, denialType, userAgent(request)));
        detectPatterns(userId, email, ipAddress, path);
    }

    @Transactional(readOnly = true)
    public AdminSecurityAuditResponse recentAudit() {
        List<AdminSecurityAuditResponse.AuditItem> logs = audits.findTop100ByOrderByCreatedAtDesc().stream()
                .map(log -> new AdminSecurityAuditResponse.AuditItem(log.getId(), log.getEmail(), log.getIpAddress(), log.getHttpMethod(),
                        log.getRequestPath(), log.getDenialType(), log.getUserAgent(), log.getCreatedAt()))
                .toList();
        List<AdminSecurityAuditResponse.AlertItem> recentAlerts = alerts.findTop20ByOrderByAlertedAtDesc().stream()
                .map(alert -> new AdminSecurityAuditResponse.AlertItem(alert.getId(), alert.getAlertType(), alert.getTargetKey(),
                        alert.getSummary(), alert.getAlertedAt()))
                .toList();
        return new AdminSecurityAuditResponse(logs, recentAlerts);
    }

    private void detectPatterns(Long userId, String email, String ipAddress, String path) {
        Instant shortSince = Instant.now().minus(SHORT_WINDOW);
        long ipAttempts = audits.countByIpAddressAndCreatedAtAfter(ipAddress, shortSince);
        if (ipAttempts >= RAPID_REPEAT_THRESHOLD) {
            alertOnce("RAPID_REPEAT", ipAddress,
                    "동일 IP에서 10분 내 관리자 권한 거부 요청이 " + ipAttempts + "회 발생했습니다. (" + ipAddress + ")");
        }

        long paths = audits.countDistinctPathsByIpAddressSince(ipAddress, shortSince);
        if (paths >= PATH_SCAN_THRESHOLD) {
            alertOnce("PATH_SCAN", ipAddress,
                    "동일 IP에서 10분 내 서로 다른 관리자 경로 " + paths + "개를 탐색했습니다. (" + ipAddress + ")");
        }

        if (userId != null) {
            long ips = audits.countDistinctIpsByUserIdSince(userId, shortSince);
            if (ips >= DISTRIBUTED_IP_THRESHOLD) {
                String target = "user:" + userId;
                String account = email == null ? "인증 계정" : email;
                alertOnce("DISTRIBUTED_IP", target,
                        account + " 계정에서 10분 내 서로 다른 IP " + ips + "개로 관리자 접근 거부가 발생했습니다.");
            }
        }
    }

    private void alertOnce(String alertType, String targetKey, String summary) {
        Instant cooldownSince = Instant.now().minus(ALERT_COOLDOWN);
        if (alerts.existsByAlertTypeAndTargetKeyAndAlertedAtAfter(alertType, targetKey, cooldownSince)) return;
        alerts.save(new AdminAccessAlertLog(alertType, targetKey, summary));
        notifications.notifyAdmins("SECURITY_ALERT", "관리자 접근 경보", summary, "/admin?view=securityAudit");
    }

    private String clientIp(HttpServletRequest request) {
        String remoteAddress = request.getRemoteAddr();
        return remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress.substring(0, Math.min(remoteAddress.length(), 45));
    }

    private String userAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return userAgent == null ? null : userAgent.substring(0, Math.min(userAgent.length(), 512));
    }
}
