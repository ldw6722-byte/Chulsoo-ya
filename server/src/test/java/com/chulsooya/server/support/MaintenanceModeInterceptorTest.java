package com.chulsooya.server.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.maintenance.PlatformMaintenanceModeService;
import com.chulsooya.server.domain.user.UserRole;

@ExtendWith(MockitoExtension.class)
class MaintenanceModeInterceptorTest {

    @Mock private PlatformMaintenanceModeService maintenance;
    @Mock private CurrentUserResolver currentUsers;

    private MaintenanceModeInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new MaintenanceModeInterceptor(maintenance, currentUsers);
    }

    @Test
    void blocks_general_api_request_while_maintenance_is_enabled() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");
        when(maintenance.isEnabled()).thenReturn(true);

        assertThatThrownBy(() -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object()))
                .isInstanceOf(DomainException.class);
    }

    @Test
    void allows_public_maintenance_status_request() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/maintenance/status");

        assertThat(interceptor.preHandle(request, new MockHttpServletResponse(), new Object())).isTrue();
    }

    @Test
    void allows_highest_administrator_api_request_while_maintenance_is_enabled() throws Exception {
        CurrentUser administrator = new CurrentUser(1L, UserRole.ADMIN);
        when(maintenance.isEnabled()).thenReturn(true);
        MockHttpServletRequest request = new MockHttpServletRequest("PATCH", "/api/admin/maintenance");
        when(currentUsers.resolve(request)).thenReturn(administrator);
        when(maintenance.isHighestAdministrator(administrator)).thenReturn(true);

        assertThat(interceptor.preHandle(request, new MockHttpServletResponse(), new Object())).isTrue();
    }
}
