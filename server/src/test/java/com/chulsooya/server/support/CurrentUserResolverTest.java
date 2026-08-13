package com.chulsooya.server.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.NativeWebRequest;

import com.chulsooya.server.domain.auth.AuthUserService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

@ExtendWith(MockitoExtension.class)
class CurrentUserResolverTest {

    @Mock
    private AuthUserService authUserService;

    @Mock
    private UserRepository users;

    @Mock
    private NativeWebRequest request;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void developmentHeaderCannotElevateDatabaseConsumerToAdmin() {
        User consumer = new User("consumer@example.test", "구매자", null, UserRole.CONSUMER);
        when(request.getHeader("X-User-Id")).thenReturn("41");
        when(users.findById(41L)).thenReturn(Optional.of(consumer));

        CurrentUserResolver resolver = new CurrentUserResolver(authUserService, users);
        CurrentUser currentUser = (CurrentUser) resolver.resolveArgument(null, null, request, null);

        assertThat(currentUser.role()).isEqualTo(UserRole.CONSUMER);
        assertThat(currentUser.isAdmin()).isFalse();
    }
}
