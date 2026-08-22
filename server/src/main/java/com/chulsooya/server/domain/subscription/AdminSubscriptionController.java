package com.chulsooya.server.domain.subscription;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.AdminChangeRequest;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.AdminMembershipResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.HistoryResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.ProductRequest;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.ProductResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.PaymentRequestResponse;
import com.chulsooya.server.domain.subscription.SubscriptionDtos.RejectPaymentRequest;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin/subscriptions")
public class AdminSubscriptionController {
    private final AdminSubscriptionService service;
    private final SubscriptionPaymentRequestService paymentRequests;

    public AdminSubscriptionController(AdminSubscriptionService service, SubscriptionPaymentRequestService paymentRequests) {
        this.service = service;
        this.paymentRequests = paymentRequests;
    }
    @GetMapping("/products") public ApiResponse<List<ProductResponse>> products(CurrentUser actor) { requireAdmin(actor); return ApiResponse.of(service.products()); }
    @PostMapping("/products") public ApiResponse<ProductResponse> create(CurrentUser actor, @Valid @RequestBody ProductRequest request) { requireAdmin(actor); return ApiResponse.of(service.create(request)); }
    @PutMapping("/products/{id}") public ApiResponse<ProductResponse> update(CurrentUser actor, @PathVariable Long id, @Valid @RequestBody ProductRequest request) { requireAdmin(actor); return ApiResponse.of(service.update(id, request)); }
    @DeleteMapping("/products/{id}") public ApiResponse<Void> remove(CurrentUser actor, @PathVariable Long id) { requireAdmin(actor); service.remove(id); return ApiResponse.of(null); }
    @GetMapping("/memberships") public ApiResponse<List<AdminMembershipResponse>> memberships(CurrentUser actor) { requireAdmin(actor); return ApiResponse.of(service.memberships()); }
    @PostMapping("/stores/{storeId}/membership") public ApiResponse<AdminMembershipResponse> change(CurrentUser actor, @PathVariable Long storeId, @Valid @RequestBody AdminChangeRequest request) { requireAdmin(actor); return ApiResponse.of(service.changeMembership(storeId, actor.userId(), request)); }
    @GetMapping("/stores/{storeId}/history") public ApiResponse<List<HistoryResponse>> history(CurrentUser actor, @PathVariable Long storeId) { requireAdmin(actor); return ApiResponse.of(service.history(storeId)); }
    @GetMapping("/payment-requests/pending") public ApiResponse<List<PaymentRequestResponse>> pendingPayments(CurrentUser actor) { requireAdmin(actor); return ApiResponse.of(paymentRequests.pending(actor)); }
    @GetMapping("/payment-requests/history") public ApiResponse<List<PaymentRequestResponse>> paymentHistory(CurrentUser actor) { requireAdmin(actor); return ApiResponse.of(paymentRequests.history(actor)); }
    @PostMapping("/payment-requests/{requestId}/approve") public ApiResponse<PaymentRequestResponse> approvePayment(CurrentUser actor, @PathVariable Long requestId) { requireAdmin(actor); return ApiResponse.of(paymentRequests.approve(actor, requestId)); }
    @PostMapping("/payment-requests/{requestId}/reject") public ApiResponse<PaymentRequestResponse> rejectPayment(CurrentUser actor, @PathVariable Long requestId, @Valid @RequestBody RejectPaymentRequest request) { requireAdmin(actor); return ApiResponse.of(paymentRequests.reject(actor, requestId, request.reason())); }
    private void requireAdmin(CurrentUser actor) { if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다."); }
}

