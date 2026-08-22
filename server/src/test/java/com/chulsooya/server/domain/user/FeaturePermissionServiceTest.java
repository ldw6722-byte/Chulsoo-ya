package com.chulsooya.server.domain.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class FeaturePermissionServiceTest {

    @Mock private UserRepository users;
    @Mock private UserFeaturePermissionRepository permissions;
    @Mock private PermissionAuditLogRepository audits;

    @Test
    void highest_administrator_can_grant_consumer_and_seller_permissions_to_a_standard_administrator() {
        User highest = highestAdministrator();
        User standard = standardAdministrator();
        FeaturePermissionService service = service();
        CurrentUser actor = new CurrentUser(1L, UserRole.ADMIN);

        when(users.findById(1L)).thenReturn(Optional.of(highest));
        when(users.findById(2L)).thenReturn(Optional.of(standard));
        when(permissions.save(any(UserFeaturePermission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FeaturePermissionService.PermissionView consumerPermission = service.change(actor, 2L,
                FeaturePermission.CONSUMER_SELLER_APPLICATION, true);
        FeaturePermissionService.PermissionView sellerPermission = service.change(actor, 2L,
                FeaturePermission.SELLER_BID_AND_FULFILLMENT, true);

        assertThat(consumerPermission.enabled()).isTrue();
        assertThat(sellerPermission.enabled()).isTrue();
    }

    @Test
    void standard_administrator_cannot_change_another_administrators_permissions() {
        User actorUser = standardAdministrator();
        User targetAdministrator = standardAdministrator();
        FeaturePermissionService service = service();
        CurrentUser actor = new CurrentUser(1L, UserRole.ADMIN);

        when(users.findById(1L)).thenReturn(Optional.of(actorUser));
        when(users.findById(2L)).thenReturn(Optional.of(targetAdministrator));

        assertThatThrownBy(() -> service.change(actor, 2L, FeaturePermission.SELLER_BID_AND_FULFILLMENT, true))
                .isInstanceOf(DomainException.class);
    }

    private FeaturePermissionService service() {
        return new FeaturePermissionService(users, permissions, audits);
    }

    private User highestAdministrator() {
        User user = new User("highest@example.com", "최고관리자", "010-1111-2222", UserRole.CONSUMER);
        ReflectionTestUtils.setField(user, "id", 1L);
        user.grantHighestAdministratorForBootstrap();
        return user;
    }

    private User standardAdministrator() {
        User user = new User("standard@example.com", "일반관리자", "010-2222-3333", UserRole.CONSUMER);
        ReflectionTestUtils.setField(user, "id", 2L);
        user.grantStandardAdministrator();
        return user;
    }
}
