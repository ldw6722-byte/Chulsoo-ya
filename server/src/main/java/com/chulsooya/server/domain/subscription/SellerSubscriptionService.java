package com.chulsooya.server.domain.subscription;

import java.time.Clock;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.HistoryResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.PaymentRequestResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.ProductResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.StatusResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.TierPolicyResponse;

@Service
public class SellerSubscriptionService {
    private final StoreRepository stores;
    private final SubscriptionProductRepository products;
    private final StoreSubscriptionHistoryRepository history;
    private final SubscriptionPaymentRequestRepository paymentRequests;
    private final Clock clock;

    public SellerSubscriptionService(StoreRepository stores, SubscriptionProductRepository products,
            StoreSubscriptionHistoryRepository history, SubscriptionPaymentRequestRepository paymentRequests, Clock clock) {
        this.stores = stores;
        this.products = products;
        this.history = history;
        this.paymentRequests = paymentRequests;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> activeProducts() {
        return products.findByActiveTrueOrderByDisplayOrderAscIdAsc().stream().map(ProductResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public StatusResponse status(Long ownerId) {
        return toStatus(requireStore(ownerId));
    }

    @Transactional(readOnly = true)
    public StatusResponse toStatus(Store store) {
        PaymentRequestResponse pending = paymentRequests
                .findFirstByStoreIdAndStatusOrderByRequestedAtDesc(store.getId(), SubscriptionPaymentRequestStatus.PENDING)
                .map(request -> new PaymentRequestResponse(request.getId(), request.getStoreId(), store.getName(),
                        request.getProductId(), request.getProductName(), request.getTier(), request.getAmount(),
                        request.getDurationMonths(), request.getStatus(), request.getRequestedAt(), request.getReviewedAt(),
                        request.getReviewedByUserId(), request.getRejectionReason()))
                .orElse(null);
        return new StatusResponse(store.getId(), store.getName(), store.getTier(), store.getSubscriptionExpiresAt(),
                store.hasActivePaidMembership(clock.instant()), Arrays.stream(SubscriptionTier.values())
                        .map(TierPolicyResponse::from).toList(),
                pending, history.findTop100ByStoreIdOrderByCreatedAtDesc(store.getId()).stream().map(HistoryResponse::from).toList());
    }

    private Store requireStore(Long ownerId) {
        return stores.findByOwnerId(ownerId)
                .orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN, "판매점 등록 판매자만 구독할 수 있습니다."));
    }
}
