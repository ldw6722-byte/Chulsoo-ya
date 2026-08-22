package com.chulsooya.server.domain.maintenance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
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
class PlatformMaintenanceModeServiceTest {

    @Mock private PlatformMaintenanceModeRepository modes;
    @Mock private MaintenanceNoticeRepository notices;
    @Mock private UserRepository users;
    @Mock private BusinessNotificationService notifications;

    private PlatformMaintenanceModeService service;
    private PlatformMaintenanceMode mode;
    private User highestAdministrator;

    @BeforeEach
    void setUp() {
        service = new PlatformMaintenanceModeService(modes, notices, users, notifications);
        mode = new PlatformMaintenanceMode(false);
        highestAdministrator = new User("highest@example.com", "최고 관리자", null, UserRole.ADMIN);
        highestAdministrator.grantHighestAdministratorForBootstrap();
    }

    @Test
    void highest_administrator_can_enable_maintenance_mode() {
        when(users.findById(1L)).thenReturn(Optional.of(highestAdministrator));
        when(modes.findById(1L)).thenReturn(Optional.of(mode));
        when(notices.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of());

        PlatformMaintenanceModeService.MaintenanceStatus status = service.update(new CurrentUser(1L, UserRole.ADMIN), true);

        assertThat(status.enabled()).isTrue();
        assertThat(mode.isEnabled()).isTrue();
        verify(modes).save(mode);
        verify(notifications).notifyHighestAdmins(any(), any(), any(), any());
    }

    @Test
    void standard_administrator_cannot_change_maintenance_mode() {
        User standardAdministrator = new User("standard@example.com", "일반 관리자", null, UserRole.ADMIN);
        standardAdministrator.grantStandardAdministrator();
        when(users.findById(2L)).thenReturn(Optional.of(standardAdministrator));

        assertThatThrownBy(() -> service.update(new CurrentUser(2L, UserRole.ADMIN), true))
                .isInstanceOf(DomainException.class);
    }

    @Test
    void activating_reusable_notice_records_activation_time_without_changing_its_display_period() {
        MaintenanceNotice selected = new MaintenanceNotice("점검 공지", "서비스 안정화 작업을 안내합니다.", false, null, null, highestAdministrator);
        Instant beforeActivation = Instant.now();
        when(users.findById(1L)).thenReturn(Optional.of(highestAdministrator));
        when(notices.findById(2L)).thenReturn(Optional.of(selected));
        when(notices.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(selected));
        when(notices.save(selected)).thenReturn(selected);

        PlatformMaintenanceModeService.MaintenanceNoticeView result = service.setNoticeActive(new CurrentUser(1L, UserRole.ADMIN), 2L, true, false);

        assertThat(result.activatedAt()).isNotNull().isAfterOrEqualTo(beforeActivation);
        assertThat(result.displayStartAt()).isNull();
        assertThat(result.displayEndAt()).isNull();
    }

    @Test
    void checked_automatic_date_output_saves_server_time_in_notice_content() {
        MaintenanceNotice selected = new MaintenanceNotice("점검 공지", "서비스 안정화 작업을 안내합니다.", false, null, null, highestAdministrator);
        when(users.findById(1L)).thenReturn(Optional.of(highestAdministrator));
        when(notices.findById(2L)).thenReturn(Optional.of(selected));
        when(notices.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(selected));
        when(notices.save(selected)).thenReturn(selected);

        PlatformMaintenanceModeService.MaintenanceNoticeView result = service.setNoticeActive(new CurrentUser(1L, UserRole.ADMIN), 2L, true, true);

        assertThat(result.title()).matches("점검 공지 \\[등록 \\d{4}\\.\\d{2}\\.\\d{2} \\d{2}:\\d{2}\\]");
        assertThat(result.content()).isEqualTo("서비스 안정화 작업을 안내합니다.");
    }

    @Test
    void activating_reusable_notice_deactivates_the_previous_notice() {
        MaintenanceNotice previous = new MaintenanceNotice("이전 공지", "이전 점검 안내", true, null, null, highestAdministrator);
        previous.setActive(true, highestAdministrator);
        MaintenanceNotice selected = new MaintenanceNotice("새 공지", "새 점검 안내", true, null, null, highestAdministrator);
        when(users.findById(1L)).thenReturn(Optional.of(highestAdministrator));
        when(notices.findById(2L)).thenReturn(Optional.of(selected));
        when(notices.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(previous, selected));
        when(notices.save(selected)).thenReturn(selected);

        PlatformMaintenanceModeService.MaintenanceNoticeView result = service.setNoticeActive(new CurrentUser(1L, UserRole.ADMIN), 2L, true, false);

        assertThat(previous.isActive()).isFalse();
        assertThat(selected.isActive()).isTrue();
        assertThat(result.active()).isTrue();
    }
}
