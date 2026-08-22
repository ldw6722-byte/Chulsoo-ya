package com.chulsooya.server.domain.support;

import static org.assertj.core.api.Assertions.assertThat;
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

import com.chulsooya.server.domain.maintenance.MaintenanceNotice;
import com.chulsooya.server.domain.maintenance.MaintenanceNoticeRepository;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class CustomerNoticeServiceTest {

    @Mock private CustomerNoticeRepository notices;
    @Mock private MaintenanceNoticeRepository maintenanceNotices;
    @Mock private UserRepository users;
    @Mock private FeaturePermissionService permissions;

    private CustomerNoticeService service;
    private User administrator;

    @BeforeEach
    void setUp() {
        service = new CustomerNoticeService(notices, maintenanceNotices, users, permissions);
        administrator = new User("admin@example.com", "공지 관리자", null, UserRole.ADMIN);
        administrator.grantStandardAdministrator();
    }

    @Test
    void public_notices_include_all_active_general_and_maintenance_notices() {
        CustomerNotice general = new CustomerNotice("배송 안내", "연휴 배송 일정을 안내합니다.", null, null, administrator);
        general.setActive(true, administrator);
        CustomerNotice future = new CustomerNotice("예정 공지", "아직 표시되지 않습니다.", Instant.now().plusSeconds(3600), null, administrator);
        future.setActive(true, administrator);
        MaintenanceNotice maintenance = new MaintenanceNotice("서비스 점검", "8월 26일 17:00부터 점검합니다.", false, null, null, administrator);
        maintenance.setActive(true, administrator);
        MaintenanceNotice expiredMaintenance = new MaintenanceNotice("서비스 안정화 점검 안내", "점검 안내는 고객센터에 유지됩니다.", false,
                Instant.now().minusSeconds(7200), Instant.now().minusSeconds(3600), administrator);
        expiredMaintenance.setActive(true, administrator);

        when(notices.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(general, future));
        when(maintenanceNotices.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(maintenance, expiredMaintenance));

        List<CustomerNoticeService.CustomerNoticeView> result = service.publicNotices();

        assertThat(result).extracting(CustomerNoticeService.CustomerNoticeView::source)
                .containsExactlyInAnyOrder(CustomerNoticeSource.GENERAL, CustomerNoticeSource.GENERAL, CustomerNoticeSource.MAINTENANCE, CustomerNoticeSource.MAINTENANCE);
        assertThat(result).extracting(CustomerNoticeService.CustomerNoticeView::title)
                .containsExactlyInAnyOrder("배송 안내", "예정 공지", "서비스 점검", "서비스 안정화 점검 안내");
    }

    @Test
    void checked_automatic_date_output_saves_registration_time_in_general_notice_title() {
        CurrentUser actor = new CurrentUser(7L, UserRole.ADMIN);
        CustomerNotice notice = new CustomerNotice("추석 배송 안내", "연휴 배송 일정을 안내합니다.", null, null, administrator);
        when(users.findById(7L)).thenReturn(Optional.of(administrator));
        when(notices.findById(3L)).thenReturn(Optional.of(notice));
        when(notices.save(notice)).thenReturn(notice);

        CustomerNoticeService.CustomerNoticeView result = service.setActive(actor, 3L, true, true);

        assertThat(result.title()).matches("추석 배송 안내 \\[등록 \\d{4}\\.\\d{2}\\.\\d{2} \\d{2}:\\d{2}\\]");
        assertThat(result.content()).isEqualTo("연휴 배송 일정을 안내합니다.");
        assertThat(result.activatedAt()).isNotNull();
    }

    @Test
    void permitted_administrator_can_create_customer_notice() {
        CurrentUser actor = new CurrentUser(7L, UserRole.ADMIN);
        when(users.findById(7L)).thenReturn(Optional.of(administrator));
        CustomerNotice saved = new CustomerNotice("운영 안내", "고객센터 공지입니다.", null, null, administrator);
        when(notices.save(org.mockito.ArgumentMatchers.any(CustomerNotice.class))).thenReturn(saved);

        CustomerNoticeService.CustomerNoticeView result = service.create(actor,
                new CustomerNoticeService.CustomerNoticeCommand("운영 안내", "고객센터 공지입니다.", null, null));

        verify(permissions).require(actor, FeaturePermission.ADMIN_MANAGE_CUSTOMER_NOTICES);
        assertThat(result.title()).isEqualTo("운영 안내");
        assertThat(result.active()).isFalse();
    }
}
