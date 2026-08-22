package com.chulsooya.server.domain.support;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserFeaturePermissionRepository;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

/**
 * 주문·응찰·심사·구독 등 도메인 이벤트의 영속 알림을 일관되게 기록한다.
 * 각 도메인은 상태 전이가 확정된 동일 트랜잭션 안에서만 이 서비스를 호출한다.
 */
@Service
@Transactional
public class BusinessNotificationService {
    private final CustomerNotificationRepository notifications;
    private final UserRepository users;
    private final UserFeaturePermissionRepository permissions;

    public BusinessNotificationService(CustomerNotificationRepository notifications, UserRepository users,
            UserFeaturePermissionRepository permissions) {
        this.notifications = notifications;
        this.users = users;
        this.permissions = permissions;
    }

    public void notifyUser(Long userId, String type, String title, String content, String targetPath) {
        if (userId == null) return;
        notifications.save(new CustomerNotification(userId, type, title, content, targetPath));
    }

    /** 보안 경보처럼 모든 관리자에게 기본 전달해야 하는 알림이다. */
    public void notifyAdmins(String type, String title, String content, String targetPath) {
        users.findByRole(UserRole.ADMIN).forEach(admin ->
                notifyUser(admin.getId(), type, title, content, targetPath));
    }

    /** 최고관리자 전용 계정·권한 변경은 최고관리자 알림함에만 전달한다. */
    public void notifyHighestAdmins(String type, String title, String content, String targetPath) {
        users.findByRole(UserRole.ADMIN).stream()
                .filter(User::isHighestAdministrator)
                .forEach(admin -> notifyUser(admin.getId(), type, title, content, targetPath));
    }

    /** 최고관리자는 항상, 일반관리자는 해당 DB 기능 토글이 ON일 때만 업무 알림을 받는다. */
    public void notifyAdminsForFeature(FeaturePermission feature, String type, String title, String content, String targetPath) {
        users.findByRole(UserRole.ADMIN).stream()
                .filter(admin -> admin.isHighestAdministrator()
                        || permissions.existsByUserIdAndPermissionCodeAndEnabledTrue(admin.getId(), feature))
                .forEach(admin -> notifyUser(admin.getId(), type, title, content, targetPath));
    }
}
