package com.chulsooya.server.domain.store;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.matching.BidService;
import com.chulsooya.server.domain.order.OrderDtos.OrderResponse;
import com.chulsooya.server.domain.order.OrderService;
import com.chulsooya.server.domain.order.OrderStatus;
import com.chulsooya.server.domain.store.SellerDtos.AssignedOrderResponse;
import com.chulsooya.server.domain.store.SellerDtos.MetricsResponse;
import com.chulsooya.server.domain.store.SellerDtos.OfferResponse;
import com.chulsooya.server.domain.store.SellerDtos.PenaltyHistoryResponse;
import com.chulsooya.server.domain.store.SellerDtos.SlotLogResponse;
import com.chulsooya.server.domain.store.SellerDtos.StoreResponse;
import com.chulsooya.server.domain.store.SellerDtos.UpdateSlotsRequest;
import com.chulsooya.server.domain.store.SellerDtos.UpdateStoreOperationsRequest;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/seller")
public class SellerController {

    private final SellerService sellerService;
    private final BidService bidService;
    private final OrderService orderService;
    private final FeaturePermissionService featurePermissions;

    public SellerController(SellerService sellerService, BidService bidService, OrderService orderService,
            FeaturePermissionService featurePermissions) {
        this.sellerService = sellerService;
        this.bidService = bidService;
        this.orderService = orderService;
        this.featurePermissions = featurePermissions;
    }

    @GetMapping("/store")
    public ApiResponse<StoreResponse> store(CurrentUser user) {
        requireSellerFeature(user, FeaturePermission.SELLER_STORE_OPERATIONS, FeaturePermission.SELLER_BID_AND_FULFILLMENT,
                FeaturePermission.SELLER_SUBSCRIPTION, FeaturePermission.SELLER_CLAIM_RESPONSE, FeaturePermission.SELLER_CATALOG);
        return ApiResponse.of(sellerService.myStore(user.userId()));
    }

    @PatchMapping("/store/operations")
    public ApiResponse<StoreResponse> updateOperations(CurrentUser user,
            @Valid @RequestBody UpdateStoreOperationsRequest request) {
        requireSellerFeature(user, FeaturePermission.SELLER_STORE_OPERATIONS);
        return ApiResponse.of(sellerService.updateOperations(user.userId(), request));
    }

    @PatchMapping("/store/slots")
    public ApiResponse<StoreResponse> updateSlots(CurrentUser user, @Valid @RequestBody UpdateSlotsRequest request) {
        requireSellerFeature(user, FeaturePermission.SELLER_STORE_OPERATIONS);
        return ApiResponse.of(sellerService.updateSlots(user.userId(), request.configuredSlots(), request.reason(), "SELLER"));
    }

    @PostMapping("/store/busy-mode")
    public ApiResponse<StoreResponse> busyMode(CurrentUser user) {
        requireSellerFeature(user, FeaturePermission.SELLER_STORE_OPERATIONS);
        return ApiResponse.of(sellerService.enterBusyMode(user.userId()));
    }

    @GetMapping("/offers")
    public ApiResponse<List<OfferResponse>> offers(CurrentUser user) {
        requireSellerFeature(user, FeaturePermission.SELLER_BID_AND_FULFILLMENT);
        return ApiResponse.of(sellerService.offerQueue(user.userId()));
    }

    /** 응찰. 동시 요청 시 서버가 단일 낙찰자만 확정한다. */
    @PostMapping("/offers/{orderId}/bid")
    public ApiResponse<OrderResponse> bid(CurrentUser user, @PathVariable Long orderId) {
        requireSellerFeature(user, FeaturePermission.SELLER_BID_AND_FULFILLMENT);
        Store store = sellerService.requireStoreByOwner(user.userId());
        bidService.placeBid(orderId, store.getId());
        return ApiResponse.of(orderService.get(orderId, user.userId(), true));
    }

    @PostMapping("/offers/{orderId}/decline")
    public ApiResponse<String> decline(CurrentUser user, @PathVariable Long orderId) {
        requireSellerFeature(user, FeaturePermission.SELLER_BID_AND_FULFILLMENT);
        Store store = sellerService.requireStoreByOwner(user.userId());
        bidService.declineOffer(orderId, store.getId());
        return ApiResponse.of("DECLINED");
    }

    @GetMapping("/orders")
    public ApiResponse<List<AssignedOrderResponse>> assignedOrders(CurrentUser user) {
        requireSellerFeature(user, FeaturePermission.SELLER_BID_AND_FULFILLMENT);
        return ApiResponse.of(sellerService.assignedOrders(user.userId()));
    }

    /** 2분 내 물품 확인 완료. 이후 소비자 결제가 열린다. */
    @PostMapping("/orders/{orderId}/confirm-stock")
    public ApiResponse<OrderResponse> confirmStock(CurrentUser user, @PathVariable Long orderId) {
        requireSellerFeature(user, FeaturePermission.SELLER_BID_AND_FULFILLMENT);
        Store store = sellerService.requireStoreByOwner(user.userId());
        bidService.confirmStock(orderId, store.getId());
        return ApiResponse.of(orderService.get(orderId, user.userId(), true));
    }

    @PostMapping("/orders/{orderId}/status/{next}")
    public ApiResponse<OrderResponse> advance(CurrentUser user,
            @PathVariable Long orderId,
            @PathVariable OrderStatus next) {
        requireSellerFeature(user, FeaturePermission.SELLER_BID_AND_FULFILLMENT);
        Store store = sellerService.requireStoreByOwner(user.userId());
        return ApiResponse.of(orderService.advanceFulfillment(orderId, store.getId(), next));
    }

    @GetMapping("/metrics")
    public ApiResponse<MetricsResponse> metrics(CurrentUser user) {
        requireSellerFeature(user, FeaturePermission.SELLER_STORE_OPERATIONS);
        return ApiResponse.of(sellerService.metrics(user.userId()));
    }

    @GetMapping("/penalties")
    public ApiResponse<List<PenaltyHistoryResponse>> penalties(CurrentUser user) {
        requireSellerFeature(user, FeaturePermission.SELLER_STORE_OPERATIONS);
        return ApiResponse.of(sellerService.penaltyHistory(user.userId()));
    }

    @GetMapping("/slot-logs")
    public ApiResponse<List<SlotLogResponse>> slotLogs(CurrentUser user) {
        requireSellerFeature(user, FeaturePermission.SELLER_STORE_OPERATIONS);
        return ApiResponse.of(sellerService.slotLogs(user.userId()));
    }

    private void requireSellerFeature(CurrentUser user, FeaturePermission... required) {
        requireSeller(user);
        if (user.isAdmin()) featurePermissions.requireAny(user, required);
    }

    private void requireSeller(CurrentUser user) {
        if (!user.isSeller() && !user.isAdmin()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "판매자 권한이 필요합니다.");
        }
    }
}
