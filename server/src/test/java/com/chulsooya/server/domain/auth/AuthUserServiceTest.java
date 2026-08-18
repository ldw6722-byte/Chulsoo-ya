package com.chulsooya.server.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

@ExtendWith(MockitoExtension.class)
class AuthUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthUserService authUserService;

    @Test
    void newSupabaseUserIsCreatedAsConsumer() {
        UUID subject = UUID.randomUUID();
        given(userRepository.findBySupabaseUserId(subject)).willReturn(Optional.empty());
        given(userRepository.save(any(User.class))).willAnswer(invocation -> invocation.getArgument(0));

        User result = authUserService.synchronize(subject, "buyer@example.com", "구매자");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        then(userRepository).should().save(captor.capture());
        User saved = captor.getValue();
        assertThat(result).isSameAs(saved);
        assertThat(saved.getSupabaseUserId()).isEqualTo(subject);
        assertThat(saved.getEmail()).isEqualTo("buyer@example.com");
        assertThat(saved.getName()).isEqualTo("구매자");
        assertThat(saved.getRole()).isEqualTo(UserRole.CONSUMER);
    }

    @Test
    void existingUserEmailIsRefreshedWithoutChangingSavedNameOrPlatformRole() {
        UUID subject = UUID.randomUUID();
        User seller = new User("old@example.com", "기존 판매자", null, UserRole.SELLER);
        given(userRepository.findBySupabaseUserId(subject)).willReturn(Optional.of(seller));

        User result = authUserService.synchronize(subject, "new@example.com", "새 이름");

        assertThat(result).isSameAs(seller);
        assertThat(result.getEmail()).isEqualTo("new@example.com");
        assertThat(result.getName()).isEqualTo("기존 판매자");
        assertThat(result.getRole()).isEqualTo(UserRole.SELLER);
        then(userRepository).shouldHaveNoMoreInteractions();
    }
}
