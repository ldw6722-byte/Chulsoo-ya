package com.chulsooya.server.domain.subscription;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.support.BusinessNotificationService;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.support.CurrentUser;

@Service
public class SubscriptionPaymentRequestService {
    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy. M. d.").withZone(KOREA);

    private final StoreRepository stores;
    private final SubscriptionProductRepository products;
    private final StoreSubscriptionHistoryRepository history;
    private final SubscriptionPaymentRequestRepository paymentRequests;
    private final BusinessNotificationService notifications;
    private final FeaturePermissionService permissions;
    private final Clock clock;

    public SubscriptionPaymentRequestService(StoreRepository stores, SubscriptionProductRepository products,
            StoreSubscriptionHistoryRepository history, SubscriptionPaymentRequestRepository paymentRequests,
            BusinessNotificationService notifications, FeaturePermissionService permissions, Clock clock) {
        this.stores = stores;
        this.products = products;
        this.history = history;
        this.paymentRequests = paymentRequests;
        this.notifications = notifications;
        this.permissions = permissions;
        this.clock = clock;
    }

    /**
     * ponytail: 개발 단계에는 내부 승인 대기만 만든다. upgrade path: PG 승인 웹훅이 approve를 호출한다.
     */
    @Transactional
    public SubscriptionDtos.PaymentRequestResponse request(Long ownerId, Long productId) {
        Store store = requireStore(ownerId);
        if (paymentRequests.existsByStoreIdAndStatus(store.getId(), SubscriptionPaymentRequestStatus.PENDING)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 승인 대기 중인 구독 결제 요청이 있습니다.");
        }
        SubscriptionProduct product = products.findById(productId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "구독 상품을 찾을 수 없습니다."));
        if (!product.isActive() || product.getTier() == SubscriptionTier.SILVER) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "현재 판매 중인 구독 상품이 아닙니다.");
        }
        Instant now = clock.instant();
        SubscriptionPaymentRequest request = paymentRequests.save(new SubscriptionPaymentRequest(store.getId(), ownerId,
                product.getId(), product.getName(), product.getTier(), product.getPrice(), product.getDurationMonths(), now));
        notifications.notifyAdminsForFeature(FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS,
                "SUBSCRIPTION_PAYMENT_REQUESTED", "구독결제 승인 대기",
                store.getName() + "의 " + product.getName() + " 결제 요청을 확인해 주세요.",
                "/admin?view=subscriptionPayments");
        return toResponse(request, store);
    }

    @Transactional(readOnly = true)
    public SubscriptionDtos.PaymentRequestResponse pendingForStore(Long ownerId) {
        Store store = requireStore(ownerId);
        return paymentRequests.findFirstByStoreIdAndStatusOrderByRequestedAtDesc(store.getId(), SubscriptionPaymentRequestStatus.PENDING)
                .map(request -> toResponse(request, store)).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDtos.PaymentRequestResponse> pending(CurrentUser actor) {
        requireSubscriptionManager(actor);
        return paymentRequests.findByStatusOrderByRequestedAtAsc(SubscriptionPaymentRequestStatus.PENDING).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDtos.PaymentRequestResponse> history(CurrentUser actor) {
        requireSubscriptionManager(actor);
        return paymentRequests.findTop100ByStatusNotOrderByReviewedAtDesc(SubscriptionPaymentRequestStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public SubscriptionDtos.PaymentRequestResponse approve(CurrentUser actor, Long requestId) {
        requireSubscriptionManager(actor);
        SubscriptionPaymentRequest request = paymentRequests.findByIdForUpdate(requestId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "구독 결제 요청을 찾을 수 없습니다."));
        if (request.getStatus() != SubscriptionPaymentRequestStatus.PENDING) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 처리된 구독 결제 요청입니다.");
        }
        Store store = stores.findByIdForUpdate(request.getStoreId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다."));
        Instant now = clock.instant();
        SubscriptionTier beforeTier = store.getTier();
        Instant beforeExpiry = store.getSubscriptionExpiresAt();
        Instant base = beforeExpiry != null && beforeExpiry.isAfter(now) ? beforeExpiry : now;
        Instant expiresAt = ZonedDateTime.ofInstant(base, KOREA).plusMonths(request.getDurationMonths()).toInstant();
        store.activateMembership(request.getTier(), expiresAt);
        request.approve(actor.userId(), now);
        history.save(new StoreSubscriptionHistory(store.getId(), request.getProductId(), beforeTier, request.getTier(),
                beforeExpiry, expiresAt, SubscriptionHistoryEvent.PURCHASED, actor.userId(),
                "개발 구독결제 승인 #" + request.getId(), now));
        notifications.notifyUser(request.getRequesterUserId(), "SUBSCRIPTION_PAYMENT_APPROVED", "구독이 적용되었습니다",
                request.getProductName() + " 구독이 승인되어 " + DATE.format(expiresAt) + "까지 적용되었습니다.",
                "/seller/subscription");
        return toResponse(request, store);
    }

    @Transactional
    public SubscriptionDtos.PaymentRequestResponse reject(CurrentUser actor, Long requestId, String reason) {
        requireSubscriptionManager(actor);
        SubscriptionPaymentRequest request = paymentRequests.findByIdForUpdate(requestId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "구독 결제 요청을 찾을 수 없습니다."));
        if (reason == null || reason.isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "반려 사유를 입력해 주세요.");
        }
        request.reject(actor.userId(), reason, clock.instant());
        Store store = stores.findById(request.getStoreId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다."));
        notifications.notifyUser(request.getRequesterUserId(), "SUBSCRIPTION_PAYMENT_REJECTED", "구독결제가 반려되었습니다",
                request.getProductName() + " 결제 요청이 반려되었습니다. 사유: " + request.getRejectionReason(),
                "/seller/subscription");
        return toResponse(request, store);
    }

    private SubscriptionDtos.PaymentRequestResponse toResponse(SubscriptionPaymentRequest request) {
        Store store = stores.findById(request.getStoreId()).orElse(null);
        return toResponse(request, store);
    }

    private SubscriptionDtos.PaymentRequestResponse toResponse(SubscriptionPaymentRequest request, Store store) {
        return new SubscriptionDtos.PaymentRequestResponse(request.getId(), request.getStoreId(),
                store == null ? "판매점 확인 중" : store.getName(), request.getProductId(), request.getProductName(),
                request.getTier(), request.getAmount(), request.getDurationMonths(), request.getStatus(),
                request.getRequestedAt(), request.getReviewedAt(), request.getReviewedByUserId(), request.getRejectionReason());
    }

    private Store requireStore(Long ownerId) {
        return stores.findByOwnerId(ownerId)
                .orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN, "판매점 등록 판매자만 구독할 수 있습니다."));
    }

    private void requireSubscriptionManager(CurrentUser actor) {
        if (!permissions.has(actor, FeaturePermission.ADMIN_MANAGE_SUBSCRIPTIONS)) {
            throw new DomainException(ErrorCode.FORBIDDEN, "구독상품 관리 권한이 필요합니다.");
        }
    }
}
