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
import com.chulsooya.server.domain.subscription.SubscriptionDtos.ProductResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.PurchaseRequest;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.StatusResponse;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/seller/subscription")
public class SellerSubscriptionController {
    private final SellerSubscriptionService service;
    public SellerSubscriptionController(SellerSubscriptionService service) { this.service = service; }
    @GetMapping("/products") public ApiResponse<List<ProductResponse>> products(CurrentUser actor) { requireSeller(actor); return ApiResponse.of(service.activeProducts()); }
    @GetMapping("/status") public ApiResponse<StatusResponse> status(CurrentUser actor) { requireSeller(actor); return ApiResponse.of(service.status(actor.userId())); }
    @PostMapping("/purchase") public ApiResponse<StatusResponse> purchase(CurrentUser actor, @Valid @RequestBody PurchaseRequest request) { requireSeller(actor); return ApiResponse.of(service.purchase(actor.userId(), request.productId())); }
    private void requireSeller(CurrentUser actor) { if (!actor.isSeller()) throw new DomainException(ErrorCode.FORBIDDEN, "판매자 권한이 필요합니다."); }
}

