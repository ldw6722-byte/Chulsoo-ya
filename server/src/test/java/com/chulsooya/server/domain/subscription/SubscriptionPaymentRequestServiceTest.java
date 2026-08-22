package com.chulsooya.server.domain.subscription;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.support.BusinessNotificationService;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class SubscriptionPaymentRequestServiceTest {
    @Mock private StoreRepository stores;
    @Mock private SubscriptionProductRepository products;
    @Mock private StoreSubscriptionHistoryRepository history;
    @Mock private SubscriptionPaymentRequestRepository paymentRequests;
    @Mock private BusinessNotificationService notifications;
    @Mock private FeaturePermissionService permissions;

    @Test
    void payment_request_keeps_the_store_on_its_current_tier_until_an_administrator_approves() {
        Store store = store();
        SubscriptionProduct product = product(SubscriptionTier.GOLD, 39_000, 1);
        when(stores.findByOwnerId(7L)).thenReturn(Optional.of(store));
        when(products.findById(3L)).thenReturn(Optional.of(product));
        when(paymentRequests.existsByStoreIdAndStatus(55L, SubscriptionPaymentRequestStatus.PENDING)).thenReturn(false);
        when(paymentRequests.save(any(SubscriptionPaymentRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionPaymentRequestService service = service();
        SubscriptionDtos.PaymentRequestResponse response = service.request(7L, 3L);

        assertThat(response.status()).isEqualTo(SubscriptionPaymentRequestStatus.PENDING);
        assertThat(response.tier()).isEqualTo(SubscriptionTier.GOLD);
        assertThat(store.getTier()).isEqualTo(SubscriptionTier.SILVER);
        verify(history, never()).save(any());
        verify(notifications).notifyAdminsForFeature(FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS,
                "SUBSCRIPTION_PAYMENT_REQUESTED", "구독결제 승인 대기", "테스트 철물점의 골드 1개월 결제 요청을 확인해 주세요.",
                "/admin?view=subscriptionPayments");
    }

    @Test
    void history_returns_only_approved_or_rejected_requests_for_administrator_review() {
        Store store = store();
        SubscriptionPaymentRequest request = new SubscriptionPaymentRequest(55L, 7L, 3L, "골드 1개월", SubscriptionTier.GOLD,
                39_000, 1, Instant.parse("2026-08-22T00:00:00Z"));
        request.approve(99L, Instant.parse("2026-08-22T01:00:00Z"));
        CurrentUser administrator = new CurrentUser(99L, UserRole.ADMIN);
        when(permissions.has(administrator, FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS)).thenReturn(true);
        when(paymentRequests.findTop100ByStatusNotOrderByReviewedAtDesc(SubscriptionPaymentRequestStatus.PENDING))
                .thenReturn(List.of(request));
        when(stores.findById(55L)).thenReturn(Optional.of(store));

        List<SubscriptionDtos.PaymentRequestResponse> responses = service().history(administrator);

        assertThat(responses).singleElement().satisfies(response -> {
            assertThat(response.status()).isEqualTo(SubscriptionPaymentRequestStatus.APPROVED);
            assertThat(response.reviewedAt()).isEqualTo(Instant.parse("2026-08-22T01:00:00Z"));
        });
        verify(paymentRequests).findTop100ByStatusNotOrderByReviewedAtDesc(SubscriptionPaymentRequestStatus.PENDING);
    }

    @Test
    void approval_applies_the_requested_membership_once_and_leaves_a_purchase_history() {
        Store store = store();
        SubscriptionPaymentRequest request = new SubscriptionPaymentRequest(55L, 7L, 3L, "골드 1개월", SubscriptionTier.GOLD,
                39_000, 1, Instant.parse("2026-08-22T00:00:00Z"));
        when(paymentRequests.findByIdForUpdate(12L)).thenReturn(Optional.of(request));
        when(stores.findByIdForUpdate(55L)).thenReturn(Optional.of(store));
        when(permissions.has(new CurrentUser(99L, UserRole.ADMIN), FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS)).thenReturn(true);

        SubscriptionPaymentRequestService service = service();
        SubscriptionDtos.PaymentRequestResponse response = service.approve(new CurrentUser(99L, UserRole.ADMIN), 12L);

        assertThat(response.status()).isEqualTo(SubscriptionPaymentRequestStatus.APPROVED);
        assertThat(store.getTier()).isEqualTo(SubscriptionTier.GOLD);
        assertThat(store.getSubscriptionExpiresAt()).isEqualTo(Instant.parse("2026-09-22T00:00:00Z"));
        ArgumentCaptor<StoreSubscriptionHistory> captured = ArgumentCaptor.forClass(StoreSubscriptionHistory.class);
        verify(history).save(captured.capture());
        assertThat(captured.getValue().getEventType()).isEqualTo(SubscriptionHistoryEvent.PURCHASED);
        assertThat(captured.getValue().getProductId()).isEqualTo(3L);
        verify(notifications).notifyUser(7L, "SUBSCRIPTION_PAYMENT_APPROVED", "구독이 적용되었습니다",
                "골드 1개월 구독이 승인되어 2026. 9. 22.까지 적용되었습니다.", "/seller/subscription");
    }

    private SubscriptionPaymentRequestService service() {
        return new SubscriptionPaymentRequestService(stores, products, history, paymentRequests, notifications, permissions,
                Clock.fixed(Instant.parse("2026-08-22T00:00:00Z"), ZoneOffset.UTC));
    }

    private Store store() {
        Store store = new Store(new User("seller@example.com", "판매자", "010", UserRole.SELLER), "테스트 철물점", "GU_TEST",
                "서울특별시 테스트구", "02", SubscriptionTier.SILVER);
        ReflectionTestUtils.setField(store, "id", 55L);
        return store;
    }

    private SubscriptionProduct product(SubscriptionTier tier, int price, int durationMonths) {
        return new SubscriptionProduct("골드 1개월", tier, price, durationMonths, "골드 운영 플랜", true, 10,
                Instant.parse("2026-08-22T00:00:00Z"));
    }
}
