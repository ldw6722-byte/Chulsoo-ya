package com.chulsooya.server.domain.admin;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
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

    public AdminPaymentController(PaymentRefundService paymentRefundService) {
        this.paymentRefundService = paymentRefundService;
    }

    @PostMapping("/{paymentId}/refunds")
    public ApiResponse<PaymentRefundView> refund(CurrentUser actor, @PathVariable Long paymentId,
            @Valid @RequestBody RefundRequest request) {
        PaymentRefund refund = paymentRefundService.refundByAdmin(actor, paymentId, request.amount(),
                request.reason(), request.idempotencyKey());
        return ApiResponse.of(paymentRefundService.paymentView(refund.getOrderId(), actor.userId(), true));
    }
}
