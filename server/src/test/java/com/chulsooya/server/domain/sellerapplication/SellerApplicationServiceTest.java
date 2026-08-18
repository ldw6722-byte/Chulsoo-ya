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
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class SellerApplicationServiceTest {

    @Mock
    private SellerApplicationRepository applications;

    @Mock
    private StoreRepository stores;

    @Mock
    private UserRepository users;

    @Test
    void admin_approval_promotes_the_applicant_and_creates_an_active_store() {
        User applicant = new User("seller@example.com", "신청자", "010-1234-5678", UserRole.CONSUMER);
        SellerApplication application = application(applicant);
        application.markCertificateUploaded("seller-applications/10/business-license", "image/jpeg", 120_000L);
        application.markBankAccountCopyUploaded("seller-applications/10/bank-account-copy", "image/jpeg", 120_000L);
        Clock clock = Clock.fixed(Instant.parse("2026-08-13T00:00:00Z"), ZoneOffset.UTC);
        SellerApplicationService service = new SellerApplicationService(applications, stores, users, clock);
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
    void admin_cannot_approve_an_application_without_a_business_certificate() {
        User applicant = new User("seller@example.com", "신청자", "010-1234-5678", UserRole.CONSUMER);
        SellerApplication application = application(applicant);
        SellerApplicationService service = new SellerApplicationService(applications, stores, users,
                Clock.fixed(Instant.parse("2026-08-13T00:00:00Z"), ZoneOffset.UTC));

        when(applications.findByIdForUpdate(10L)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> service.approve(new CurrentUser(99L, UserRole.ADMIN), 10L))
                .isInstanceOf(DomainException.class);
        assertThat(application.getStatus()).isEqualTo(SellerApplicationStatus.PENDING);
    }

    private SellerApplication application(User applicant) {
        return new SellerApplication(
                applicant, "철수 철물", "김철수", "123-45-67890", "서울특별시", "강남구", "GU_GANGNAM",
                "서울특별시 강남구 테헤란로 1", "010-1234-5678", "철물,공구");
    }
}
