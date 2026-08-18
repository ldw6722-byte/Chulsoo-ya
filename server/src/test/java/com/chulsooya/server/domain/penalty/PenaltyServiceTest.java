package com.chulsooya.server.domain.penalty;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

@ExtendWith(MockitoExtension.class)
class PenaltyServiceTest {

    @Mock
    private PenaltyRepository penalties;

    @Test
    void timeout_penalty_is_recorded_and_applied_to_the_store_once() {
        Store store = new Store(new User("seller@example.com", "판매자", "010", UserRole.SELLER),
                "철수 철물", "GU_TEST", "서울시 테스트구 1", "02", SubscriptionTier.SILVER);
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        PenaltyService service = new PenaltyService(penalties);

        when(penalties.existsByOrderIdAndViolationType(55L, PenaltyViolationType.SELLER_CONFIRMATION_TIMEOUT))
                .thenReturn(false);

        boolean applied = service.applySellerConfirmationTimeout(55L, 77L, store, now);

        assertThat(applied).isTrue();
        assertThat(store.getRestrictedUntil()).isEqualTo(now.plusSeconds(24 * 60 * 60));
        assertThat(store.getTrustScore()).isEqualTo(50.0);
        verify(penalties).save(any(Penalty.class));
    }

    @Test
    void duplicate_timeout_penalty_does_not_change_the_store_again() {
        Store store = new Store(new User("seller@example.com", "판매자", "010", UserRole.SELLER),
                "철수 철물", "GU_TEST", "서울시 테스트구 1", "02", SubscriptionTier.SILVER);
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        PenaltyService service = new PenaltyService(penalties);

        when(penalties.existsByOrderIdAndViolationType(55L, PenaltyViolationType.SELLER_CONFIRMATION_TIMEOUT))
                .thenReturn(true);

        assertThat(service.applySellerConfirmationTimeout(55L, 77L, store, now)).isFalse();
        assertThat(store.getTrustScore()).isEqualTo(60.0);
        assertThat(store.getRestrictedUntil()).isNull();
    }
}
