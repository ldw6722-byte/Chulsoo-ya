package com.chulsooya.server.domain.subscription;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.HistoryResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.ProductResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.StatusResponse;
import com.chulsooya.server.domain.support.BusinessNotificationService;

@Service
public class SellerSubscriptionService {
    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
    private final StoreRepository stores;
    private final SubscriptionProductRepository products;
    private final StoreSubscriptionHistoryRepository history;
        private final Clock clock;
    private final BusinessNotificationService notifications;
    public SellerSubscriptionService(StoreRepository stores, SubscriptionProductRepository products, StoreSubscriptionHistoryRepository history, Clock clock, BusinessNotificationService notifications) {
        this.stores = stores; this.products = products; this.history = history; this.clock = clock; this.notifications = notifications;

    }
    @Transactional(readOnly = true)
    public List<ProductResponse> activeProducts() { return products.findByActiveTrueOrderByDisplayOrderAscIdAsc().stream().map(ProductResponse::from).toList(); }
    @Transactional(readOnly = true)
    public StatusResponse status(Long ownerId) { return toStatus(requireStore(ownerId)); }
    @Transactional
    public StatusResponse purchase(Long ownerId, Long productId) {
        Instant now = clock.instant();
        Store store = requireStore(ownerId);
        SubscriptionProduct product = products.findById(productId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "구독 상품을 찾을 수 없습니다."));
        if (!product.isActive() || product.getTier() == SubscriptionTier.SILVER) throw new DomainException(ErrorCode.VALIDATION_FAILED, "구독 가능한 상품이 아닙니다.");
        SubscriptionTier beforeTier = store.getTier(); Instant beforeExpiry = store.getSubscriptionExpiresAt();
        Instant base = beforeExpiry != null && beforeExpiry.isAfter(now) ? beforeExpiry : now;
        Instant expiresAt = ZonedDateTime.ofInstant(base, KOREA).plusMonths(product.getDurationMonths()).toInstant();
        store.activateMembership(product.getTier(), expiresAt);
                history.save(new StoreSubscriptionHistory(store.getId(), product.getId(), beforeTier, product.getTier(), beforeExpiry, expiresAt, SubscriptionHistoryEvent.PURCHASED, ownerId, "개발 결제 자동 승인", now));
        notifications.notifyUser(ownerId, "SUBSCRIPTION_PURCHASED", "구독이 적용되었습니다",
                product.getName() + " 구독이 " + expiresAt + "까지 적용되었습니다.", "/seller/subscription");
        return toStatus(store);

    }
    @Transactional(readOnly = true)
    public StatusResponse toStatus(Store store) { return new StatusResponse(store.getId(), store.getName(), store.getTier(), store.getSubscriptionExpiresAt(), store.hasActivePaidMembership(clock.instant()), history.findTop100ByStoreIdOrderByCreatedAtDesc(store.getId()).stream().map(HistoryResponse::from).toList()); }
    private Store requireStore(Long ownerId) { return stores.findByOwnerId(ownerId).orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN, "판매점 등록 판매자만 구독할 수 있습니다.")); }
}

