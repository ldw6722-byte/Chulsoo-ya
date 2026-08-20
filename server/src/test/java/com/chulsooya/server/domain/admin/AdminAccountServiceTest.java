package com.chulsooya.server.domain.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.user.AdminLevel;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class AdminAccountServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private SupabaseAdminInvitationClient invitations;

    @Test
    void highestAdministratorCanInviteStandardAdministrator() {
        User highest = new User("highest@example.test", "최고 관리자", null, UserRole.ADMIN);
        highest.grantHighestAdministratorForBootstrap();
        when(users.findById(1L)).thenReturn(Optional.of(highest));
        when(users.findByEmail("operator@example.test")).thenReturn(Optional.empty());

        AdminAccountService service = new AdminAccountService(users, invitations);
        service.inviteStandardAdministrator(new CurrentUser(1L, UserRole.ADMIN),
                new AdminAccountDtos.InviteRequest("operator@example.test", "운영 담당자"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        verify(invitations).invite("operator@example.test", "운영 담당자");
        assertThat(saved.getValue().getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(saved.getValue().getAdminLevel()).isEqualTo(AdminLevel.STANDARD);
    }

    @Test
    void standardAdministratorCannotInviteAnotherAdministrator() {
        User standard = new User("operator@example.test", "일반 관리자", null, UserRole.ADMIN);
        standard.grantStandardAdministrator();
        when(users.findById(2L)).thenReturn(Optional.of(standard));

        AdminAccountService service = new AdminAccountService(users, invitations);

        assertThatThrownBy(() -> service.inviteStandardAdministrator(new CurrentUser(2L, UserRole.ADMIN),
                new AdminAccountDtos.InviteRequest("next@example.test", "추가 운영자")))
                .isInstanceOf(DomainException.class);
        verifyNoInteractions(invitations);
    }
}
