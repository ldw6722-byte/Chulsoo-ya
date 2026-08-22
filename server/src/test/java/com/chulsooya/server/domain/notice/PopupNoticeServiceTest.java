package com.chulsooya.server.domain.notice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.support.BusinessNotificationService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class PopupNoticeServiceTest {

    @Mock private PopupNoticeRepository notices;
    @Mock private UserRepository users;
    @Mock private BusinessNotificationService notifications;

    private PopupNoticeService service;
    private User highestAdministrator;

    @BeforeEach
    void setUp() {
        service = new PopupNoticeService(notices, users, notifications);
        highestAdministrator = new User("highest@example.com", "최고 관리자", null, UserRole.ADMIN);
        highestAdministrator.grantHighestAdministratorForBootstrap();
    }

    @Test
    void activating_popup_deactivates_the_previous_active_popup() {
        PopupNotice previous = new PopupNotice("이전 팝업", "이전 내용", null, null, highestAdministrator);
        previous.setActive(true, highestAdministrator);
        PopupNotice selected = new PopupNotice("새 팝업", "새 내용", null, null, highestAdministrator);
        when(users.findById(1L)).thenReturn(Optional.of(highestAdministrator));
        when(notices.findById(2L)).thenReturn(Optional.of(selected));
        when(notices.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(previous, selected));
        when(notices.save(selected)).thenReturn(selected);

        PopupNoticeService.PopupNoticeView result = service.setActive(new CurrentUser(1L, UserRole.ADMIN), 2L, true);

        assertThat(previous.isActive()).isFalse();
        assertThat(selected.isActive()).isTrue();
        assertThat(result.active()).isTrue();
    }

    @Test
    void standard_administrator_cannot_manage_popup_advertising() {
        User standardAdministrator = new User("standard@example.com", "일반 관리자", null, UserRole.ADMIN);
        standardAdministrator.grantStandardAdministrator();
        when(users.findById(2L)).thenReturn(Optional.of(standardAdministrator));

        assertThatThrownBy(() -> service.list(new CurrentUser(2L, UserRole.ADMIN)))
                .isInstanceOf(DomainException.class);
    }

    @Test
    void public_active_notice_excludes_inactive_and_out_of_window_popups() {
        PopupNotice future = new PopupNotice("예정 팝업", "아직 표시되지 않습니다", Instant.now().plusSeconds(3600), null, highestAdministrator);
        future.setActive(true, highestAdministrator);
        PopupNotice visible = new PopupNotice("현재 팝업", "현재 표시됩니다", Instant.now().minusSeconds(60), Instant.now().plusSeconds(3600), highestAdministrator);
        visible.setActive(true, highestAdministrator);
        PopupNotice inactive = new PopupNotice("비활성 팝업", "표시되지 않습니다", null, null, highestAdministrator);
        when(notices.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(future, visible, inactive));

        PopupNoticeService.PopupNoticeView result = service.activeNotice();

        assertThat(result).isNotNull();
        assertThat(result.title()).isEqualTo("현재 팝업");
    }
}
