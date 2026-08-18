package com.chulsooya.server.domain.support;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public BusinessNotificationService(CustomerNotificationRepository notifications, UserRepository users) {
        this.notifications = notifications;
        this.users = users;
    }

    public void notifyUser(Long userId, String type, String title, String content, String targetPath) {
        if (userId == null) return;
        notifications.save(new CustomerNotification(userId, type, title, content, targetPath));
    }

    public void notifyAdmins(String type, String title, String content, String targetPath) {
        users.findByRole(UserRole.ADMIN).forEach(admin ->
                notifyUser(admin.getId(), type, title, content, targetPath));
    }
}
