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
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin/subscriptions")
public class AdminSubscriptionController {
    private final AdminSubscriptionService service;
    public AdminSubscriptionController(AdminSubscriptionService service) { this.service = service; }
    @GetMapping("/products") public ApiResponse<List<ProductResponse>> products(CurrentUser actor) { requireAdmin(actor); return ApiResponse.of(service.products()); }
    @PostMapping("/products") public ApiResponse<ProductResponse> create(CurrentUser actor, @Valid @RequestBody ProductRequest request) { requireAdmin(actor); return ApiResponse.of(service.create(request)); }
    @PutMapping("/products/{id}") public ApiResponse<ProductResponse> update(CurrentUser actor, @PathVariable Long id, @Valid @RequestBody ProductRequest request) { requireAdmin(actor); return ApiResponse.of(service.update(id, request)); }
    @DeleteMapping("/products/{id}") public ApiResponse<Void> remove(CurrentUser actor, @PathVariable Long id) { requireAdmin(actor); service.remove(id); return ApiResponse.of(null); }
    @GetMapping("/memberships") public ApiResponse<List<AdminMembershipResponse>> memberships(CurrentUser actor) { requireAdmin(actor); return ApiResponse.of(service.memberships()); }
    @PostMapping("/stores/{storeId}/membership") public ApiResponse<AdminMembershipResponse> change(CurrentUser actor, @PathVariable Long storeId, @Valid @RequestBody AdminChangeRequest request) { requireAdmin(actor); return ApiResponse.of(service.changeMembership(storeId, actor.userId(), request)); }
    @GetMapping("/stores/{storeId}/history") public ApiResponse<List<HistoryResponse>> history(CurrentUser actor, @PathVariable Long storeId) { requireAdmin(actor); return ApiResponse.of(service.history(storeId)); }
    private void requireAdmin(CurrentUser actor) { if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다."); }
}

