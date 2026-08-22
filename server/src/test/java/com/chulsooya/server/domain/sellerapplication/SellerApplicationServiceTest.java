package com.chulsooya.server.domain.sellerapplication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.region.ServiceRegionService;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.support.BusinessNotificationService;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class SellerApplicationServiceTest {

    @Mock
    private SellerApplicationRepository applications;

    @Mock
    private StoreRepository stores;

    @Mock
    private UserRepository users;

    @Mock
    private BusinessNotificationService notifications;

    @Mock
    private FeaturePermissionService permissions;

    @Mock
    private ServiceRegionService regions;

    @Test
    void consumer_submission_uses_the_canonical_region_resolved_from_the_kakao_address() {
        User applicant = new User("seller@example.com", "신청자", "010-1234-5678", UserRole.CONSUMER);
        CurrentUser actor = new CurrentUser(10L, UserRole.CONSUMER);
        when(users.findById(10L)).thenReturn(Optional.of(applicant));
        when(applications.findByApplicantId(10L)).thenReturn(Optional.empty());
        when(regions.resolveAddress("서울특별시 강남구 테헤란로 1"))
                .thenReturn(new ServiceRegionService.RegionView("11680", "서울특별시", "강남구", "서울특별시 강남구"));
        when(applications.save(any(SellerApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service(clock()).submit(actor, request());

        ArgumentCaptor<SellerApplication> saved = ArgumentCaptor.forClass(SellerApplication.class);
        verify(applications).save(saved.capture());
        assertThat(saved.getValue().getGuCode()).isEqualTo("11680");
        assertThat(saved.getValue().getCityName()).isEqualTo("서울특별시");
        assertThat(saved.getValue().getDistrictName()).isEqualTo("강남구");
    }

    @Test
    void admin_approval_promotes_the_consumer_applicant_and_creates_an_active_store() {
        User applicant = new User("seller@example.com", "신청자", "010-1234-5678", UserRole.CONSUMER);
        SellerApplication application = application(applicant);
        application.markCertificateUploaded("seller-applications/10/business-license", "image/jpeg", 120_000L);
        application.markBankAccountCopyUploaded("seller-applications/10/bank-account-copy", "image/jpeg", 120_000L);
        Clock clock = clock();
        SellerApplicationService service = service(clock);

        CurrentUser admin = new CurrentUser(99L, UserRole.ADMIN);
        when(applications.findByIdForUpdate(10L)).thenReturn(Optional.of(application));
        when(stores.findByOwnerId(null)).thenReturn(Optional.empty());

        service.approve(admin, 10L);

        assertThat(application.getStatus()).isEqualTo(SellerApplicationStatus.APPROVED);
        assertThat(applicant.getRole()).isEqualTo(UserRole.SELLER);
        ArgumentCaptor<Store> createdStore = ArgumentCaptor.forClass(Store.class);
        verify(stores).save(createdStore.capture());
        assertThat(createdStore.getValue().canReceiveOffer(clock.instant())).isTrue();
    }

    @Test
    void highest_administrator_can_submit_and_be_approved_without_losing_administrator_access() {
        User highestAdministrator = new User("highest@example.com", "최고관리자", "010-1111-2222", UserRole.CONSUMER);
        highestAdministrator.grantHighestAdministratorForBootstrap();
        SellerApplicationService service = service(clock());
        CurrentUser actor = new CurrentUser(77L, UserRole.ADMIN);

        when(users.findById(77L)).thenReturn(Optional.of(highestAdministrator));
        when(applications.findByApplicantId(77L)).thenReturn(Optional.empty());
        when(applications.save(any(SellerApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SellerApplicationDtos.ApplicantResponse submitted = service.submitInternalAdministratorApplication(actor);

        assertThat(submitted.status()).isEqualTo(SellerApplicationStatus.PENDING.name());
        ArgumentCaptor<SellerApplication> saved = ArgumentCaptor.forClass(SellerApplication.class);
        verify(applications).save(saved.capture());
        SellerApplication application = saved.getValue();
        
        when(applications.findByIdForUpdate(10L)).thenReturn(Optional.of(application));
        when(stores.findByOwnerId(null)).thenReturn(Optional.empty());

        service.approve(actor, 10L);

        assertThat(highestAdministrator.isHighestAdministrator()).isTrue();
        assertThat(highestAdministrator.getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(application.getStatus()).isEqualTo(SellerApplicationStatus.APPROVED);
        verify(stores).save(any(Store.class));
    }

    @Test
    void standard_administrator_with_consumer_seller_application_toggle_can_submit_for_testing() {
        User standardAdministrator = new User("standard@example.com", "일반관리자", "010-2222-3333", UserRole.CONSUMER);
        standardAdministrator.grantStandardAdministrator();
        SellerApplicationService service = service(clock());
        CurrentUser actor = new CurrentUser(78L, UserRole.ADMIN);

        when(users.findById(78L)).thenReturn(Optional.of(standardAdministrator));
        when(applications.findByApplicantId(78L)).thenReturn(Optional.empty());
        when(permissions.has(actor, FeaturePermission.CONSUMER_SELLER_APPLICATION)).thenReturn(true);
        when(applications.save(any(SellerApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SellerApplicationDtos.ApplicantResponse submitted = service.submitInternalAdministratorApplication(actor);

        assertThat(submitted.status()).isEqualTo(SellerApplicationStatus.PENDING.name());
        verify(permissions).has(actor, FeaturePermission.CONSUMER_SELLER_APPLICATION);
    }

    @Test
    void highest_administrator_can_submit_and_force_approve_an_internal_seller_application_without_documents() {
        User highestAdministrator = new User("highest@example.com", "최고관리자", "010-1111-2222", UserRole.CONSUMER);
        highestAdministrator.grantHighestAdministratorForBootstrap();
        SellerApplicationService service = service(clock());
        CurrentUser actor = new CurrentUser(77L, UserRole.ADMIN);

        when(users.findById(77L)).thenReturn(Optional.of(highestAdministrator));
        when(applications.findByApplicantId(77L)).thenReturn(Optional.empty());
        when(applications.save(any(SellerApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SellerApplicationDtos.ApplicantResponse submitted = service.submitInternalAdministratorApplication(actor);

        assertThat(submitted.internalAdminApplication()).isTrue();
        assertThat(submitted.certificateSubmitted()).isFalse();
        ArgumentCaptor<SellerApplication> saved = ArgumentCaptor.forClass(SellerApplication.class);
        verify(applications).save(saved.capture());
        SellerApplication application = saved.getValue();
        assertThat(application.isInternalAdminApplication()).isTrue();
        when(applications.findByIdForUpdate(10L)).thenReturn(Optional.of(application));
        when(stores.findByOwnerId(null)).thenReturn(Optional.empty());

        service.approve(actor, 10L);

        assertThat(application.getStatus()).isEqualTo(SellerApplicationStatus.APPROVED);
        assertThat(highestAdministrator.isHighestAdministrator()).isTrue();
        assertThat(highestAdministrator.getRole()).isEqualTo(UserRole.ADMIN);
        verify(stores).save(any(Store.class));
    }

    @Test
    void administrator_without_the_consumer_seller_application_toggle_is_rejected() {
        User standardAdministrator = new User("standard@example.com", "일반관리자", "010-2222-3333", UserRole.CONSUMER);
        standardAdministrator.grantStandardAdministrator();
        SellerApplicationService service = service(clock());
        CurrentUser actor = new CurrentUser(78L, UserRole.ADMIN);

        when(users.findById(78L)).thenReturn(Optional.of(standardAdministrator));
        when(permissions.has(actor, FeaturePermission.CONSUMER_SELLER_APPLICATION)).thenReturn(false);

        assertThatThrownBy(() -> service.submitInternalAdministratorApplication(actor)).isInstanceOf(DomainException.class);
    }

    @Test
    void admin_cannot_approve_an_application_without_a_business_certificate() {
        User applicant = new User("seller@example.com", "신청자", "010-1234-5678", UserRole.CONSUMER);
        SellerApplication application = application(applicant);
        SellerApplicationService service = service(clock());

        when(applications.findByIdForUpdate(10L)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> service.approve(new CurrentUser(99L, UserRole.ADMIN), 10L))
                .isInstanceOf(DomainException.class);
        assertThat(application.getStatus()).isEqualTo(SellerApplicationStatus.PENDING);
    }

    private SellerApplicationService service(Clock clock) {
        return new SellerApplicationService(applications, stores, users, clock, notifications, permissions, regions);
    }

    private Clock clock() {
        return Clock.fixed(Instant.parse("2026-08-22T00:00:00Z"), ZoneOffset.UTC);
    }

    private SellerApplicationDtos.SubmitRequest request() {
        return new SellerApplicationDtos.SubmitRequest("철수 철물", "김철수", "123-45-67890", null, "서울특별시", "강남구",
                "서울특별시 강남구 테헤란로 1", "010-1234-5678", "철물,공구");
    }

    private SellerApplication application(User applicant) {
        return new SellerApplication(
                applicant, "철수 철물", "김철수", "123-45-67890", "서울특별시", "강남구", "GU_GANGNAM",
                "서울특별시 강남구 테헤란로 1", "010-1234-5678", "철물,공구");
    }
}
