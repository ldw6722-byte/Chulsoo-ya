package com.chulsooya.server.domain.sellerdeactivation;

import java.time.Instant;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@RestController
@Transactional
@RequiredArgsConstructor
public class SellerDeactivationController {
    private final SellerDeactivationService service;
    @PostMapping("/api/seller-deactivations") public ApiResponse<Response> request(CurrentUser actor, @RequestBody Request body) { requireSeller(actor); return ApiResponse.of(Response.from(service.request(actor.userId(), body.reason()))); }
    @GetMapping("/api/seller-deactivations/me") public ApiResponse<Response> mine(CurrentUser actor) { requireSeller(actor); return ApiResponse.of(service.mine(actor.userId()).map(Response::from).orElse(null)); }
    @GetMapping("/api/admin/seller-deactivations") public ApiResponse<List<Response>> pending(CurrentUser actor) { requireAdmin(actor); return ApiResponse.of(service.pending().stream().map(Response::from).toList()); }
    @PostMapping("/api/admin/seller-deactivations/{requestId}/approve") public ApiResponse<Response> approve(CurrentUser actor, @PathVariable Long requestId) { requireAdmin(actor); return ApiResponse.of(Response.from(service.approve(requestId, actor.userId()))); }
    @PostMapping("/api/admin/seller-deactivations/{requestId}/reject") public ApiResponse<Response> reject(CurrentUser actor, @PathVariable Long requestId, @RequestBody(required = false) RejectRequest body) { requireAdmin(actor); return ApiResponse.of(Response.from(service.reject(requestId, actor.userId(), body == null ? null : body.reason()))); }
    private void requireSeller(CurrentUser actor) { if (actor.role() != UserRole.SELLER) throw new DomainException(ErrorCode.FORBIDDEN, "판매자 계정만 이용할 수 있습니다."); }
    private void requireAdmin(CurrentUser actor) { if (actor.role() != UserRole.ADMIN) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다."); }
    public record Request(String reason) {}
    public record RejectRequest(String reason) {}
    public record Response(Long id, Long sellerUserId, String sellerName, String sellerEmail, SellerDeactivationStatus status, String reason, Instant requestedAt, Instant reviewedAt, String rejectionReason) { static Response from(SellerDeactivationRequest request) { return new Response(request.getId(), request.getSeller().getId(), request.getSeller().getName(), request.getSeller().getEmail(), request.getStatus(), request.getReason(), request.getRequestedAt(), request.getReviewedAt(), request.getRejectionReason()); } }
}
