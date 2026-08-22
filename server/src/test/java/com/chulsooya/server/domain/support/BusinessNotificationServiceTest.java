package com.chulsooya.server.domain.support;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserFeaturePermissionRepository;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

@ExtendWith(MockitoExtension.class)
class BusinessNotificationServiceTest {

    @Mock
    private CustomerNotificationRepository notifications;

    @Mock
    private UserRepository users;

    @Mock
    private UserFeaturePermissionRepository permissions;

    @Test
    void featureNotificationReachesHighestAndOnlyEnabledStandardAdministrators() {
        User highest = administrator(1L, true);
        User allowed = administrator(2L, false);
        User denied = administrator(3L, false);
        when(users.findByRole(UserRole.ADMIN)).thenReturn(List.of(highest, allowed, denied));
        when(permissions.existsByUserIdAndPermissionCodeAndEnabledTrue(2L, FeaturePermission.ADMIN_MANAGE_SUPPORT)).thenReturn(true);
        when(permissions.existsByUserIdAndPermissionCodeAndEnabledTrue(3L, FeaturePermission.ADMIN_MANAGE_SUPPORT)).thenReturn(false);

        BusinessNotificationService service = new BusinessNotificationService(notifications, users, permissions);
        service.notifyAdminsForFeature(FeaturePermission.ADMIN_MANAGE_SUPPORT, "INQUIRY_SUBMITTED",
                "새 고객 문의가 접수되었습니다", "문의 답변이 필요합니다.", "/admin?view=support");

        verify(notifications, times(2)).save(any(CustomerNotification.class));
        verify(permissions).existsByUserIdAndPermissionCodeAndEnabledTrue(2L, FeaturePermission.ADMIN_MANAGE_SUPPORT);
        verify(permissions).existsByUserIdAndPermissionCodeAndEnabledTrue(3L, FeaturePermission.ADMIN_MANAGE_SUPPORT);
    }

    private User administrator(Long id, boolean highest) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(id);
        when(user.isHighestAdministrator()).thenReturn(highest);
        return user;
    }
}
