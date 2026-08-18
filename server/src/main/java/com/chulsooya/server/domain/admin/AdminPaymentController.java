package com.chulsooya.server.domain.admin;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.order.DevelopmentPaymentApprovalService;
import com.chulsooya.server.domain.claim.SettlementService;
import com.chulsooya.server.domain.order.OrderDtos.OrderResponse;
import com.chulsooya.server.domain.order.DevelopmentPaymentApprovalService.ApprovalHistoryResponse;
import com.chulsooya.server.domain.order.PaymentRefund;
import com.chulsooya.server.domain.order.PaymentRefundService;
import com.chulsooya.server.domain.order.PaymentRefundView;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {
    public record RefundRequest(@Min(1) int amount, @NotBlank String reason, @NotBlank String idempotencyKey) {}

    private final PaymentRefundService paymentRefundService;
    private final DevelopmentPaymentApprovalService developmentPaymentApprovalService;
    private final SettlementService settlementService;

    public AdminPaymentController(PaymentRefundService paymentRefundService, DevelopmentPaymentApprovalService developmentPaymentApprovalService, SettlementService settlementService) {
        this.paymentRefundService = paymentRefundService;
        this.developmentPaymentApprovalService = developmentPaymentApprovalService;
        this.settlementService = settlementService;
    }

    @GetMapping("/development-pending")
    public ApiResponse<List<OrderResponse>> developmentPending(CurrentUser actor) {
        return ApiResponse.of(developmentPaymentApprovalService.pendingOrders(actor));
    }

    @GetMapping("/development-history")
    public ApiResponse<List<ApprovalHistoryResponse>> developmentHistory(CurrentUser actor) {
        return ApiResponse.of(developmentPaymentApprovalService.approvalHistory(actor));
    }

    @PostMapping("/orders/{orderId}/development-approve")
    public ApiResponse<OrderResponse> developmentApprove(CurrentUser actor, @PathVariable Long orderId) {
        return ApiResponse.of(developmentPaymentApprovalService.approve(actor, orderId));
    }

    @GetMapping("/settlements")
    public ApiResponse<List<SettlementService.SettlementResponse>> settlements(CurrentUser actor) {
        if (actor.role() != com.chulsooya.server.domain.user.UserRole.ADMIN) throw new com.chulsooya.server.common.DomainException(com.chulsooya.server.common.ErrorCode.FORBIDDEN);
        return ApiResponse.of(settlementService.list());
    }

    @GetMapping("/settlements/summary")
    public ApiResponse<SettlementService.SettlementSummary> settlementSummary(CurrentUser actor) {
        if (actor.role() != com.chulsooya.server.domain.user.UserRole.ADMIN) throw new com.chulsooya.server.common.DomainException(com.chulsooya.server.common.ErrorCode.FORBIDDEN);
        return ApiResponse.of(settlementService.summary());
    }

    @PostMapping("/{paymentId}/refunds")
    public ApiResponse<PaymentRefundView> refund(CurrentUser actor, @PathVariable Long paymentId,
            @Valid @RequestBody RefundRequest request) {
        PaymentRefund refund = paymentRefundService.refundByAdmin(actor, paymentId, request.amount(),
                request.reason(), request.idempotencyKey());
        return ApiResponse.of(paymentRefundService.paymentView(refund.getOrderId(), actor.userId(), true));
    }
}
