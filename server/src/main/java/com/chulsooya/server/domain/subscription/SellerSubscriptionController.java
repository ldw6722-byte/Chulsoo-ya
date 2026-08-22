package com.chulsooya.server.domain.subscription;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.PaymentRequestResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.ProductResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.PurchaseRequest;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.StatusResponse;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/seller/subscription")
public class SellerSubscriptionController {
    private final SellerSubscriptionService subscriptions;
    private final SubscriptionPaymentRequestService paymentRequests;
    private final FeaturePermissionService featurePermissions;

    public SellerSubscriptionController(SellerSubscriptionService subscriptions,
            SubscriptionPaymentRequestService paymentRequests, FeaturePermissionService featurePermissions) {
        this.subscriptions = subscriptions;
        this.paymentRequests = paymentRequests;
        this.featurePermissions = featurePermissions;
    }

    @GetMapping("/products")
    public ApiResponse<List<ProductResponse>> products(CurrentUser actor) {
        requireSeller(actor);
        return ApiResponse.of(subscriptions.activeProducts());
    }

    @GetMapping("/status")
    public ApiResponse<StatusResponse> status(CurrentUser actor) {
        requireSeller(actor);
        return ApiResponse.of(subscriptions.status(actor.userId()));
    }

    @PostMapping("/payment-requests")
    public ApiResponse<PaymentRequestResponse> requestPayment(CurrentUser actor,
            @Valid @RequestBody PurchaseRequest request) {
        requireSeller(actor);
        return ApiResponse.of(paymentRequests.request(actor.userId(), request.productId()));
    }

    private void requireSeller(CurrentUser actor) {
        if (!actor.isSeller() && !actor.isAdmin()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "판매자 권한이 필요합니다.");
        }
        if (actor.isAdmin()) featurePermissions.require(actor, FeaturePermission.SELLER_SUBSCRIPTION);
    }
}
